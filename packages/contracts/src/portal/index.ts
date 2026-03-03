/**
 * Portal Contracts — Zod schemas for Supplier Portal 2.0 (SP-2000 series).
 *
 * These schemas are shared between frontend (apps/web) and backend (apps/api).
 * Pure schema definitions — no DB, no HTTP.
 */
import { z } from 'zod';

// ─── Portal Request Context Schema ──────────────────────────────────────────

/**
 * Canonical enum values are defined in @afenda/supplier-kernel (portal-request-context.ts).
 * These Zod schemas mirror them for contract validation. Keep in sync.
 */
export const PortalRoleSchema = z.enum([
  'PORTAL_OWNER',
  'PORTAL_FINANCE',
  'PORTAL_OPERATIONS',
  'PORTAL_READONLY',
]);
export type PortalRoleContract = z.infer<typeof PortalRoleSchema>;

export const ActorTypeSchema = z.enum(['SUPPLIER', 'BUYER', 'SYSTEM']);
export type ActorTypeContract = z.infer<typeof ActorTypeSchema>;

export const PortalPermissionSchema = z.enum([
  'INVOICE_SUBMIT',
  'INVOICE_READ',
  'CASE_CREATE',
  'CASE_READ',
  'MSG_SEND',
  'MSG_READ',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_READ',
  'ESCALATE',
  'BANK_ACCOUNT_MANAGE',
  'BANK_ACCOUNT_READ',
  'API_KEY_MANAGE',
  'USER_MANAGE',
  'COMPLIANCE_READ',
  'COMPLIANCE_UPLOAD',
  'PAYMENT_READ',
  'PROFILE_UPDATE',
  'NOTIFICATION_MANAGE',
  'APPOINTMENT_CREATE',
  'APPOINTMENT_READ',
]);
export type PortalPermissionContract = z.infer<typeof PortalPermissionSchema>;

/**
 * PortalRequestContextSchema — Zod shape for the immutable identity envelope.
 * Maps to PortalRequestContext interface in @afenda/supplier-kernel.
 *
 * Used for: API response validation, OpenAPI generation, E2E contract tests.
 */
export const PortalRequestContextSchema = z.object({
  tenantId: z.string().uuid(),
  supplierId: z.string().uuid(),
  portalUserId: z.string().uuid(),
  entityIds: z.array(z.string().uuid()),
  portalRole: PortalRoleSchema,
  permissions: z.array(PortalPermissionSchema),
  actorFingerprint: z.string(),
  idempotencyKey: z.string().uuid().optional(),
});
export type PortalRequestContextContract = z.infer<typeof PortalRequestContextSchema>;

// ─── Portal Error Envelope ──────────────────────────────────────────────────

export const PortalErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  traceId: z.string().optional(),
});
export type PortalError = z.infer<typeof PortalErrorSchema>;

// ─── List Response (generic) ────────────────────────────────────────────────

export function ListResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    hasMore: z.boolean(),
  });
}

// ─── SP-2001: Case Contracts ────────────────────────────────────────────────

export const CaseStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_INFO',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
]);
export type CaseStatusContract = z.infer<typeof CaseStatusSchema>;

export const CaseCategorySchema = z.enum([
  'PAYMENT',
  'INVOICE',
  'COMPLIANCE',
  'DELIVERY',
  'QUALITY',
  'ONBOARDING',
  'GENERAL',
  'ESCALATION',
]);
export type CaseCategoryContract = z.infer<typeof CaseCategorySchema>;

export const CasePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type CasePriorityContract = z.infer<typeof CasePrioritySchema>;

export const CreateCaseSchema = z.object({
  category: CaseCategorySchema,
  priority: CasePrioritySchema,
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().uuid().optional(),
});
export type CreateCase = z.infer<typeof CreateCaseSchema>;

export const CaseResponseSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(), // CASE-AFD-2026-00142
  tenantId: z.string().uuid(),
  supplierId: z.string().uuid(),
  category: CaseCategorySchema,
  priority: CasePrioritySchema,
  status: CaseStatusSchema,
  subject: z.string(),
  description: z.string(),
  assignedTo: z.string().uuid().nullable(),
  assignedToName: z.string().nullable(),
  linkedEntityType: z.string().nullable(),
  linkedEntityId: z.string().uuid().nullable(),
  slaResponseDeadline: z.string().datetime().nullable(),
  slaResolutionDeadline: z.string().datetime().nullable(),
  resolution: z.string().nullable(),
  rootCause: z.string().nullable(),
  correctiveAction: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CaseResponse = z.infer<typeof CaseResponseSchema>;

export const CaseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: CaseStatusSchema.optional(),
  category: CaseCategorySchema.optional(),
  priority: CasePrioritySchema.optional(),
  search: z.string().max(200).optional(),
});
export type CaseListQuery = z.infer<typeof CaseListQuerySchema>;

export const CaseListResponseSchema = ListResponseSchema(CaseResponseSchema);
export type CaseListResponse = z.infer<typeof CaseListResponseSchema>;

// ─── Case Mutations (Phase 1.1.1) ──────────────────────────────────────────

export const UpdateCaseSchema = z.object({
  priority: CasePrioritySchema.optional(),
  subject: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  resolution: z.string().min(1).max(5000).optional(),
  rootCause: z.string().min(1).max(5000).optional(),
  correctiveAction: z.string().min(1).max(5000).optional(),
});
export type UpdateCase = z.infer<typeof UpdateCaseSchema>;

export const TransitionCaseStatusSchema = z.object({
  status: CaseStatusSchema,
  comment: z.string().max(2000).optional(),
});
export type TransitionCaseStatus = z.infer<typeof TransitionCaseStatusSchema>;

export const AssignCaseSchema = z.object({
  assignedTo: z.string().uuid(),
  coAssignees: z.array(z.string().uuid()).max(10).optional(),
  comment: z.string().max(2000).optional(),
});
export type AssignCase = z.infer<typeof AssignCaseSchema>;

export const AddTimelineMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  /**
   * Optional attachments referenced by ID — already uploaded via SP-1007.
   * Timeline entry type will be 'message'.
   */
  attachmentIds: z.array(z.string().uuid()).max(10).optional(),
});
export type AddTimelineMessage = z.infer<typeof AddTimelineMessageSchema>;

// ─── Timeline Entry ─────────────────────────────────────────────────────────

export const TimelineEntryTypeSchema = z.enum([
  'status',
  'message',
  'attachment',
  'escalation',
  'sla_breach',
  'payment',
  'match',
  'system',
]);
export type TimelineEntryType = z.infer<typeof TimelineEntryTypeSchema>;

export const TimelineEntrySchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  entryType: TimelineEntryTypeSchema,
  actorId: z.string().uuid(),
  actorType: ActorTypeSchema,
  actorName: z.string(),
  content: z.record(z.unknown()),
  proofHash: z.string().nullable(),
  createdAt: z.string().datetime(),
  /** Reference to source entity (e.g., supplier_message.id) — timeline doesn't duplicate source. */
  refId: z.string().uuid().nullable(),
  refType: z.string().nullable(),
});
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const TimelineListResponseSchema = ListResponseSchema(TimelineEntrySchema);
export type TimelineListResponse = z.infer<typeof TimelineListResponseSchema>;

// ─── Payment Stage ──────────────────────────────────────────────────────────

export const PaymentStageSchema = z.enum([
  'SCHEDULED',
  'APPROVED',
  'PROCESSING',
  'SENT',
  'CLEARED',
  'ON_HOLD',
  'REJECTED',
]);
export type PaymentStageContract = z.infer<typeof PaymentStageSchema>;

export const PaymentSourceSchema = z.enum(['BANK_FILE', 'ERP', 'MANUAL_OVERRIDE']);
export type PaymentSourceContract = z.infer<typeof PaymentSourceSchema>;

export const PaymentStatusFactSchema = z.object({
  id: z.string().uuid(),
  paymentRunId: z.string().uuid(),
  stage: PaymentStageSchema,
  source: PaymentSourceSchema,
  bankRef: z.string().nullable(),
  eta: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type PaymentStatusFact = z.infer<typeof PaymentStatusFactSchema>;

// ─── Proof Chain Verification ───────────────────────────────────────────────

export const ProofChainVerifyResultSchema = z.object({
  valid: z.boolean(),
  entriesChecked: z.number().int().nonnegative(),
  firstInvalidPosition: z.coerce.number().optional(),
  message: z.string(),
});
export type ProofChainVerifyResult = z.infer<typeof ProofChainVerifyResultSchema>;

// ─── Dispute → Case Transition Aliases ──────────────────────────────────────
// V2 §3.3: "Keep the dispute Zod schemas as aliases during transition."
// These re-export case schemas under dispute names so existing consumers
// can migrate incrementally.  Remove after Phase 1.2 cut-over.

/** @deprecated Use CreateCaseSchema */
export const CreateDisputeSchema = CreateCaseSchema;
/** @deprecated Use CreateCase */
export type CreateDispute = CreateCase;

/** @deprecated Use CaseResponseSchema */
export const DisputeResponseSchema = CaseResponseSchema;
/** @deprecated Use CaseResponse */
export type DisputeResponse = CaseResponse;

/** @deprecated Use CaseListQuerySchema */
export const DisputeListQuerySchema = CaseListQuerySchema;
/** @deprecated Use CaseListQuery */
export type DisputeListQuery = CaseListQuery;

/** @deprecated Use CaseListResponseSchema */
export const DisputeListResponseSchema = CaseListResponseSchema;
/** @deprecated Use CaseListResponse */
export type DisputeListResponse = CaseListResponse;

// ─── SP-2005: Onboarding Wizard Contracts (Phase 1.1.2 CAP-ONB) ────────────

export const OnboardingStepSchema = z.enum([
  'company_info',
  'bank_details',
  'kyc_documents',
  'tax_registration',
  'review',
]);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

export const OnboardingStatusSchema = z.enum([
  'PROSPECT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

/** Company info step draft payload. */
export const CompanyInfoDraftSchema = z.object({
  tradingName: z.string().max(200).optional(),
  registrationNumber: z.string().max(50).optional(),
  countryOfIncorporation: z.string().length(3).optional(),
  legalForm: z.string().max(50).optional(),
  industryCode: z.string().max(20).optional(),
  industryDescription: z.string().max(200).optional(),
});
export type CompanyInfoDraft = z.infer<typeof CompanyInfoDraftSchema>;

/** Bank details step draft payload. */
export const BankDetailsDraftSchema = z.object({
  bankName: z.string().max(200).optional(),
  accountName: z.string().max(200).optional(),
  accountNumber: z.string().max(50).optional(),
  iban: z.string().max(34).optional(),
  swiftBic: z.string().max(11).optional(),
  localBankCode: z.string().max(20).optional(),
  currencyId: z.string().uuid().optional(),
});
export type BankDetailsDraft = z.infer<typeof BankDetailsDraftSchema>;

/** KYC documents step draft payload — references uploaded legal doc IDs. */
export const KycDocumentsDraftSchema = z.object({
  documentIds: z.array(z.string().uuid()).max(20).default([]),
});
export type KycDocumentsDraft = z.infer<typeof KycDocumentsDraftSchema>;

/** Tax registration step draft payload. */
export const TaxRegistrationDraftSchema = z.object({
  taxId: z.string().max(50).optional(),
  vatNumber: z.string().max(50).optional(),
  taxRegime: z.string().max(100).optional(),
  taxCountry: z.string().length(3).optional(),
});
export type TaxRegistrationDraft = z.infer<typeof TaxRegistrationDraftSchema>;

/** Save draft for a single wizard step. */
export const SaveOnboardingDraftSchema = z.object({
  step: OnboardingStepSchema,
  draft: z.union([
    CompanyInfoDraftSchema,
    BankDetailsDraftSchema,
    KycDocumentsDraftSchema,
    TaxRegistrationDraftSchema,
  ]),
});
export type SaveOnboardingDraft = z.infer<typeof SaveOnboardingDraftSchema>;

/** Full onboarding submission response (read). */
export const PortalOnboardingSubmissionSchema = z.object({
  id: z.string().uuid(),
  supplierId: z.string().uuid(),
  currentStep: OnboardingStepSchema,
  completedSteps: z.array(OnboardingStepSchema),
  companyInfoDraft: CompanyInfoDraftSchema.nullable(),
  bankDetailsDraft: BankDetailsDraftSchema.nullable(),
  kycDocumentsDraft: KycDocumentsDraftSchema.nullable(),
  taxRegistrationDraft: TaxRegistrationDraftSchema.nullable(),
  isSubmitted: z.boolean(),
  submittedAt: z.string().datetime().nullable(),
  onboardingStatus: OnboardingStatusSchema,
  rejectionReason: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
});
export type OnboardingSubmissionResponse = z.infer<typeof PortalOnboardingSubmissionSchema>;

/** Reject onboarding (buyer admin action). */
export const RejectOnboardingSchema = z.object({
  reason: z.string().min(10).max(2000),
});
export type RejectOnboarding = z.infer<typeof RejectOnboardingSchema>;

// ─── SP-2006: Compliance Expiry Alerts Contracts (Phase 1.1.3 CAP-COMPL) ───

export const ComplianceItemTypeSchema = z.enum([
  'KYC',
  'TAX_CLEARANCE',
  'INSURANCE',
  'BANK_VERIFICATION',
  'TRADE_LICENSE',
]);
export type ComplianceItemTypeContract = z.infer<typeof ComplianceItemTypeSchema>;

export const ComplianceStatusSchema = z.enum([
  'VALID',
  'EXPIRING_SOON',
  'EXPIRED',
  'PENDING',
  'NOT_SUBMITTED',
]);
export type ComplianceStatusContract = z.infer<typeof ComplianceStatusSchema>;

export const ComplianceAlertTypeSchema = z.enum([
  'EXPIRING_30D',
  'EXPIRING_14D',
  'EXPIRING_7D',
  'EXPIRED',
]);
export type ComplianceAlertType = z.infer<typeof ComplianceAlertTypeSchema>;

/** Single compliance item in a summary. */
export const ComplianceItemResponseSchema = z.object({
  id: z.string().uuid(),
  itemType: ComplianceItemTypeSchema,
  label: z.string(),
  status: ComplianceStatusSchema,
  isCompliant: z.boolean(),
  expiryDate: z.string().datetime().nullable(),
  issuedDate: z.string().datetime().nullable(),
  documentId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  lastVerifiedBy: z.string().uuid().nullable(),
  lastVerifiedAt: z.string().datetime().nullable(),
  daysUntilExpiry: z.number().int().nullable(),
});
export type ComplianceItemResponse = z.infer<typeof ComplianceItemResponseSchema>;

/** Full compliance summary returned by GET /compliance. */
export const ComplianceSummaryResponseSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(ComplianceItemResponseSchema),
  overallStatus: ComplianceStatusSchema,
  expiredCount: z.number().int().nonnegative(),
  expiringSoonCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
});
export type ComplianceSummaryResponse = z.infer<typeof ComplianceSummaryResponseSchema>;

/** Alert log entry — tracks when a specific expiry alert was dispatched. */
export const PortalComplianceAlertLogSchema = z.object({
  id: z.string().uuid(),
  complianceItemId: z.string().uuid(),
  itemType: ComplianceItemTypeSchema,
  alertType: ComplianceAlertTypeSchema,
  alertedAt: z.string().datetime(),
  supersededAt: z.string().datetime().nullable(),
});
export type ComplianceAlertLog = z.infer<typeof PortalComplianceAlertLogSchema>;

/** GET /compliance/alerts query. */
export const ComplianceAlertListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  alertType: ComplianceAlertTypeSchema.optional(),
  active: z.coerce.boolean().optional(),
});
export type ComplianceAlertListQuery = z.infer<typeof ComplianceAlertListQuerySchema>;

/** Renewal request — supplier uploads a new document to renew an item. */
export const RenewComplianceItemSchema = z.object({
  documentId: z.string().uuid(),
  newExpiryDate: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});
export type RenewComplianceItem = z.infer<typeof RenewComplianceItemSchema>;

/** Compliance timeline entry for tracking history. */
export const PortalComplianceTimelineEntrySchema = z.object({
  id: z.string().uuid(),
  itemType: ComplianceItemTypeSchema,
  eventType: z.enum([
    'ITEM_CREATED',
    'ALERT_SENT',
    'DOCUMENT_UPLOADED',
    'RENEWAL_SUBMITTED',
    'VERIFIED',
    'EXPIRED',
    'AUTO_CASE_CREATED',
  ]),
  actorId: z.string().uuid().nullable(),
  actorType: z.enum(['SUPPLIER', 'BUYER', 'SYSTEM']).nullable(),
  details: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type ComplianceTimelineEntry = z.infer<typeof PortalComplianceTimelineEntrySchema>;

export const ComplianceTimelineResponseSchema = z.object({
  items: z.array(PortalComplianceTimelineEntrySchema),
  total: z.number().int().nonnegative(),
});
export type ComplianceTimelineResponse = z.infer<typeof ComplianceTimelineResponseSchema>;

// ─── SP-2007: Audit Trail (CAP-AUDIT) ──────────────────────────────────────

/** Audit log action categories (supplier-relevant subset). */
export const AuditActionSchema = z.enum([
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'UPLOAD',
  'RENEW',
  'ESCALATE',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

/** Supplier-facing resource names (table/entity categories). */
export const AuditResourceSchema = z.enum([
  'supplier',
  'supplier_invoice',
  'supplier_case',
  'supplier_case_timeline',
  'supplier_document',
  'supplier_bank_account',
  'supplier_compliance_item',
  'supplier_compliance_alert_log',
  'supplier_dispute',
  'supplier_onboarding',
  'supplier_message',
]);
export type AuditResource = z.infer<typeof AuditResourceSchema>;

/** A single audit log entry — supplier-facing view (no oldData/newData). */
export const PortalAuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().uuid().nullable(),
  actorId: z.string().uuid().nullable(),
  ipAddress: z.string().nullable(),
  occurredAt: z.string().datetime(),
  description: z.string(),
});
export type AuditLogEntry = z.infer<typeof PortalAuditLogEntrySchema>;

/** Query parameters for the audit log list endpoint. */
export const AuditLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: AuditActionSchema.optional(),
  resource: AuditResourceSchema.optional(),
});
export type AuditLogListQuery = z.infer<typeof AuditLogListQuerySchema>;

/** Paginated audit log response. */
export const PortalAuditLogListSchema = z.object({
  items: z.array(PortalAuditLogEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type AuditLogListResponse = z.infer<typeof PortalAuditLogListSchema>;

// ─── SP-2003: Company Location Directory (Phase 1.1.5 CAP-LOC) ─────────────

/** Location types for company addresses */
export const LocationTypeSchema = z.enum(['HQ', 'WAREHOUSE', 'BILLING', 'SHIPPING', 'BRANCH']);
export type LocationType = z.infer<typeof LocationTypeSchema>;

/** A single company location — buyer's address exposed to suppliers */
export const PortalLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  locationType: LocationTypeSchema,
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  stateProvince: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  latitude: z.string().nullable(), // Decimal string
  longitude: z.string().nullable(),
  primaryContactName: z.string().nullable(),
  primaryContactEmail: z.string().email().nullable(),
  primaryContactPhone: z.string().nullable(),
  businessHoursStart: z.string().nullable(), // HH:MM format
  businessHoursEnd: z.string().nullable(),
  timezone: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
});
export type CompanyLocation = z.infer<typeof PortalLocationSchema>;

/** Query parameters for location list endpoint */
export const LocationListQuerySchema = z.object({
  locationType: LocationTypeSchema.optional(),
  includeInactive: z.coerce.boolean().default(false),
});
export type LocationListQuery = z.infer<typeof LocationListQuerySchema>;

/** Location list response */
export const LocationListResponseSchema = z.object({
  items: z.array(PortalLocationSchema),
  total: z.number().int(),
});
export type LocationListResponse = z.infer<typeof LocationListResponseSchema>;

// ─── SP-2004: Senior Management Directory (Phase 1.1.6 CAP-DIR) ────────────

/** Department categories for directory entries */
export const DepartmentSchema = z.enum([
  'ACCOUNTS_PAYABLE',
  'PROCUREMENT',
  'COMPLIANCE',
  'FINANCE_MANAGEMENT',
  'EXECUTIVE',
  'OPERATIONS',
  'LEGAL',
]);
export type Department = z.infer<typeof DepartmentSchema>;

/** A single directory entry — buyer's contact information with privacy controls */
export const PortalDirectoryEntrySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  title: z.string(),
  department: DepartmentSchema,
  emailAddress: z.string().email(),
  masked: z.boolean(), // True if email is masked (e.g., 'j.smith@...')
  phoneNumber: z.string().nullable(),
  availability: z.string().nullable(),
  timezone: z.string().nullable(),
  bio: z.string().nullable(),
  isEscalationContact: z.boolean(),
});
export type DirectoryEntry = z.infer<typeof PortalDirectoryEntrySchema>;

/** Query parameters for directory list endpoint */
export const DirectoryListQuerySchema = z.object({
  department: DepartmentSchema.optional(),
  escalationOnly: z.coerce.boolean().default(false),
});
export type DirectoryListQuery = z.infer<typeof DirectoryListQuerySchema>;

/** Directory list response */
export const DirectoryListResponseSchema = z.object({
  items: z.array(PortalDirectoryEntrySchema),
  total: z.number().int(),
});
export type DirectoryListResponse = z.infer<typeof DirectoryListResponseSchema>;

// ─── SP-2008: Supplier Invitation Flow (Phase 1.1.7 CAP-INV) ───────────────

/** Invitation status — lifecycle states for magic link invitations */
export const InvitationStatusSchema = z.enum([
  'PENDING', // Sent, awaiting acceptance
  'ACCEPTED', // Supplier clicked link and started onboarding
  'EXPIRED', // Token expired (default: 7 days)
  'REVOKED', // Buyer cancelled invitation
]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

/** Request to send a supplier invitation (buyer-initiated) */
export const SendInvitationRequestSchema = z.object({
  email: z.string().email().max(255),
  supplierName: z.string().min(1).max(255),
  invitationMessage: z.string().max(2000).optional(),
});
export type SendInvitationRequest = z.infer<typeof SendInvitationRequestSchema>;

/** Response after sending invitation */
export const SendInvitationResponseSchema = z.object({
  invitationId: z.string().uuid(),
  email: z.string().email(),
  supplierName: z.string(),
  status: InvitationStatusSchema,
  expiresAt: z.string(), // ISO 8601 timestamp
  magicLink: z.string().url(), // For internal testing only; not sent to production clients
});
export type SendInvitationResponse = z.infer<typeof SendInvitationResponseSchema>;

/** A single invitation record (list view) */
export const InvitationSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  supplierName: z.string(),
  status: InvitationStatusSchema,
  sentAt: z.string(), // ISO 8601
  expiresAt: z.string(), // ISO 8601
  acceptedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  invitedBy: z.string().uuid(),
  supplierId: z.string().uuid().nullable(), // Set after acceptance
});
export type InvitationSummary = z.infer<typeof InvitationSummarySchema>;

/** Query parameters for listing invitations */
export const InvitationListQuerySchema = z.object({
  status: InvitationStatusSchema.optional(),
  email: z.string().email().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type InvitationListQuery = z.infer<typeof InvitationListQuerySchema>;

/** Invitation list response */
export const InvitationListResponseSchema = z.object({
  items: z.array(InvitationSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type InvitationListResponse = z.infer<typeof InvitationListResponseSchema>;

/** Request to accept invitation (supplier-initiated, public route) */
export const AcceptInvitationRequestSchema = z.object({
  token: z.string().length(64), // Secure random token (hex)
});
export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;

/** Response after accepting invitation */
export const AcceptInvitationResponseSchema = z.object({
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  email: z.string().email(),
  onboardingRedirectUrl: z.string().url(), // Redirect to onboarding wizard
});
export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;

/** Revoke invitation request (buyer-initiated) */
export const RevokeInvitationRequestSchema = z.object({
  invitationId: z.string().uuid(),
});
export type RevokeInvitationRequest = z.infer<typeof RevokeInvitationRequestSchema>;

/** Revoke invitation response */
export const RevokeInvitationResponseSchema = z.object({
  invitationId: z.string().uuid(),
  status: InvitationStatusSchema, // Should be 'REVOKED'
  revokedAt: z.string(), // ISO 8601
});
export type RevokeInvitationResponse = z.infer<typeof RevokeInvitationResponseSchema>;

// ─── SP-2009: Messaging Hub (Phase 1.2.1 CAP-MSG) ──────────────────────────

/** Sender type for portal messages */
export const SenderTypeSchema = z.enum(['SUPPLIER', 'BUYER']);
export type SenderType = z.infer<typeof SenderTypeSchema>;

/** A single message thread */
export const PortalMessageThreadSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  caseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  subject: z.string(),
  lastMessageAt: z.coerce.date(),
  lastMessageBy: z.string().uuid(),
  supplierUnreadCount: z.number().int().min(0),
  buyerUnreadCount: z.number().int().min(0),
  isSupplierArchived: z.boolean(),
  isBuyerArchived: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type MessageThread = z.infer<typeof PortalMessageThreadSchema>;

/** A single message within a thread */
export const PortalMessageSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  threadId: z.string().uuid(),
  body: z.string(),
  senderType: SenderTypeSchema,
  senderId: z.string().uuid(),
  readAt: z.coerce.date().nullable(),
  readBy: z.string().uuid().nullable(),
  attachmentIds: z.array(z.string().uuid()),
  proofHash: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Message = z.infer<typeof PortalMessageSchema>;

/** Start a new thread (may create implicit case) */
export const StartThreadRequestSchema = z.object({
  caseId: z.string().uuid().optional(), // Optional: creates implicit "GENERAL" case if omitted
  subject: z.string().min(1).max(255),
  initialMessageBody: z.string().min(1).max(10000),
  attachmentIds: z.array(z.string().uuid()).default([]),
  idempotencyKey: z.string().min(1).max(64),
});
export type StartThreadRequest = z.infer<typeof StartThreadRequestSchema>;

/** Send a message in an existing thread */
export const SendMessageRequestSchema = z.object({
  body: z.string().min(1).max(10000),
  attachmentIds: z.array(z.string().uuid()).default([]),
  idempotencyKey: z.string().min(1).max(64),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/** Query parameters for listing message threads */
export const ThreadListQuerySchema = z.object({
  caseId: z.string().uuid().optional(),
  includeArchived: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ThreadListQuery = z.infer<typeof ThreadListQuerySchema>;

/** Query parameters for listing messages */
export const MessageListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type MessageListQuery = z.infer<typeof MessageListQuerySchema>;

/** Thread list response */
export const PortalThreadListResponseSchema = z.object({
  items: z.array(PortalMessageThreadSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type ThreadListResponse = z.infer<typeof PortalThreadListResponseSchema>;

/** Message list response */
export const PortalMessageListResponseSchema = z.object({
  items: z.array(PortalMessageSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type MessageListResponse = z.infer<typeof PortalMessageListResponseSchema>;

/** Mark message as read */
export const MarkReadRequestSchema = z.object({
  readBy: z.string().uuid(), // Who is marking it read
});
export type MarkReadRequest = z.infer<typeof MarkReadRequestSchema>;

// ─── SP-2003: Escalation Contracts (Phase 1.2.2 CAP-SOS P19) ───────────────

/**
 * Escalation status lifecycle:
 *   ESCALATION_REQUESTED → ESCALATION_ASSIGNED → ESCALATION_IN_PROGRESS → ESCALATION_RESOLVED
 *
 * Mirrors ESCALATION_STATUSES in @afenda/supplier-kernel portal-status-dictionary.ts.
 */
export const EscalationStatusSchema = z.enum([
  'ESCALATION_REQUESTED',
  'ESCALATION_ASSIGNED',
  'ESCALATION_IN_PROGRESS',
  'ESCALATION_RESOLVED',
]);
export type EscalationStatus = z.infer<typeof EscalationStatusSchema>;

/** Full escalation entity — returned from GET endpoints */
export const PortalEscalationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  caseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  triggeredBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  assignedAt: z.coerce.date().nullable(),
  status: EscalationStatusSchema,
  reason: z.string(),
  respondByAt: z.coerce.date(),
  resolveByAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  resolutionNotes: z.string().nullable(),
  proofHash: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Escalation = z.infer<typeof PortalEscalationSchema>;

/** SLA countdown metadata appended to GET single escalation response */
export const PortalEscalationSlaSchema = z.object({
  respondByAt: z.coerce.date(),
  resolveByAt: z.coerce.date(),
  respondSlaBreached: z.boolean(),
  resolveSlaBreached: z.boolean(),
  hoursUntilRespond: z.number(),
  hoursUntilResolve: z.number(),
});
export type EscalationSla = z.infer<typeof PortalEscalationSlaSchema>;

/** Escalation detail — escalation + live SLA info */
export const PortalEscalationDetailSchema = PortalEscalationSchema.extend({
  sla: PortalEscalationSlaSchema,
});
export type EscalationDetail = z.infer<typeof PortalEscalationDetailSchema>;

/** Trigger a breakglass escalation on an open case */
export const TriggerEscalationRequestSchema = z.object({
  caseId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(2000),
});
export type TriggerEscalationRequest = z.infer<typeof TriggerEscalationRequestSchema>;

/** Query parameters for listing escalations */
export const EscalationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: EscalationStatusSchema.optional(),
  caseId: z.string().uuid().optional(),
});
export type EscalationListQuery = z.infer<typeof EscalationListQuerySchema>;

/** Paginated escalation list response */
export const PortalEscalationListResponseSchema = z.object({
  items: z.array(PortalEscalationSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type EscalationListResponse = z.infer<typeof PortalEscalationListResponseSchema>;

/** Resolve an escalation (buyer-side only) */
export const ResolveEscalationRequestSchema = z.object({
  resolutionNotes: z.string().min(10, 'Resolution notes must be at least 10 characters').max(5000),
});
export type ResolveEscalationRequest = z.infer<typeof ResolveEscalationRequestSchema>;

// ─── SP-2010: CAP-ANNOUNCE — Dashboard Announcements (Phase 1.2.3 P24) ─────

export const AnnouncementSeveritySchema = z.enum(['INFO', 'WARNING', 'CRITICAL']);
export type AnnouncementSeverity = z.infer<typeof AnnouncementSeveritySchema>;

export const PortalAnnouncementSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(10000),
  severity: AnnouncementSeveritySchema,
  pinned: z.boolean(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().nullable(),
  createdBy: z.string(),
  archivedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Announcement = z.infer<typeof PortalAnnouncementSchema>;

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must be at most 120 characters'),
  body: z.string().min(1, 'Body is required').max(10000),
  severity: AnnouncementSeveritySchema.default('INFO'),
  pinned: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});
export type CreateAnnouncementRequest = z.infer<typeof CreateAnnouncementSchema>;

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(10000).optional(),
  severity: AnnouncementSeveritySchema.optional(),
  pinned: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});
export type UpdateAnnouncementRequest = z.infer<typeof UpdateAnnouncementSchema>;

export const AnnouncementListQuerySchema = z.object({
  pinned: z.coerce.boolean().optional(),
  severity: AnnouncementSeveritySchema.optional(),
  includeArchived: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type AnnouncementListQuery = z.infer<typeof AnnouncementListQuerySchema>;

export const AnnouncementListResponseSchema = z.object({
  items: z.array(PortalAnnouncementSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type AnnouncementListResponse = z.infer<typeof AnnouncementListResponseSchema>;

// ─── CAP-APPT P27: Appointment Scheduling ────────────────────────────────────

export const MeetingRequestStatusSchema = z.enum([
  'REQUESTED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
]);
export type MeetingRequestStatus = z.infer<typeof MeetingRequestStatusSchema>;

export const MeetingTypeSchema = z.enum(['VIRTUAL', 'IN_PERSON']);
export type MeetingType = z.infer<typeof MeetingTypeSchema>;

export const PortalMeetingRequestSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  requestedBy: z.string(),
  supplierId: z.string(),
  requestedWith: z.string().nullable(),
  meetingType: MeetingTypeSchema,
  agenda: z.string(),
  location: z.string().nullable(),
  proposedTimes: z.array(z.string()),
  confirmedTime: z.string().datetime().nullable(),
  durationMinutes: z.string(),
  caseId: z.string().nullable(),
  escalationId: z.string().nullable(),
  status: MeetingRequestStatusSchema,
  cancellationReason: z.string().nullable(),
  buyerNotes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MeetingRequestResponse = z.infer<typeof PortalMeetingRequestSchema>;

export const CreateMeetingRequestSchema = z.object({
  requestedWith: z.string().uuid().optional(),
  meetingType: MeetingTypeSchema.default('VIRTUAL'),
  agenda: z.string().min(1).max(2000),
  location: z.string().max(500).optional(),
  proposedTimes: z
    .array(z.string().datetime())
    .min(1, 'At least one proposed time is required')
    .max(3, 'At most 3 proposed times are allowed'),
  durationMinutes: z.enum(['15', '30', '45', '60']).default('30'),
  caseId: z.string().uuid().optional(),
  escalationId: z.string().uuid().optional(),
});
export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequestSchema>;

export const ConfirmMeetingRequestSchema = z.object({
  confirmedTime: z.string().datetime(),
  buyerNotes: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
});
export type ConfirmMeetingRequest = z.infer<typeof ConfirmMeetingRequestSchema>;

export const CancelMeetingRequestSchema = z.object({
  cancellationReason: z.string().max(1000).optional(),
});
export type CancelMeetingRequest = z.infer<typeof CancelMeetingRequestSchema>;

export const MeetingRequestListQuerySchema = z.object({
  status: MeetingRequestStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type MeetingRequestListQuery = z.infer<typeof MeetingRequestListQuerySchema>;

export const MeetingRequestListResponseSchema = z.object({
  items: z.array(PortalMeetingRequestSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type MeetingRequestListResponse = z.infer<typeof MeetingRequestListResponseSchema>;

// ─── SP-2012: CAP-SCF — Supply Chain Finance / Early Payment Offers (P3) ────

export const EarlyPaymentOfferStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED']);
export type EarlyPaymentOfferStatus = z.infer<typeof EarlyPaymentOfferStatusSchema>;

export const EarlyPaymentPricingTypeSchema = z.enum(['APR', 'FLAT']);
export type EarlyPaymentPricingType = z.infer<typeof EarlyPaymentPricingTypeSchema>;

/** Read representation of an early payment offer (supplier-safe). */
export const EarlyPaymentOfferSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  supplierId: z.string().uuid(),
  /** ISO date-time — when offer expires. */
  offerExpiresAt: z.string().datetime(),
  /** Proposed early payment date if accepted. */
  proposedPaymentDate: z.string().datetime(),
  /** Original invoice due date. */
  originalDueDate: z.string().datetime(),
  /** Discount rate in basis points (e.g., 50 = 0.50%). */
  discountBps: z.number().int().nonnegative(),
  /** Annualized APR in basis points (e.g., 1250 = 12.50% APR). */
  aprBps: z.number().int().nonnegative(),
  pricingType: EarlyPaymentPricingTypeSchema,
  /** Invoice face value in minor currency units (string to preserve precision). */
  invoiceAmountMinor: z.string(),
  /** Discount amount in minor currency units. */
  discountAmountMinor: z.string(),
  /** Net early payment amount (invoice - discount). */
  netPaymentAmountMinor: z.string(),
  currency: z.string().length(3),
  status: EarlyPaymentOfferStatusSchema,
  acceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EarlyPaymentOffer = z.infer<typeof EarlyPaymentOfferSchema>;

/** Supplier accepts an early payment offer. */
export const AcceptEarlyPaymentOfferSchema = z.object({
  /** Explicit confirmation acknowledgement. */
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly confirm acceptance.' }),
  }),
});
export type AcceptEarlyPaymentOffer = z.infer<typeof AcceptEarlyPaymentOfferSchema>;

/** Supplier declines an early payment offer. */
export const DeclineEarlyPaymentOfferSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type DeclineEarlyPaymentOffer = z.infer<typeof DeclineEarlyPaymentOfferSchema>;

/** AP-side: create an early payment offer for a qualifying invoice. */
export const CreateEarlyPaymentOfferSchema = z.object({
  invoiceId: z.string().uuid(),
  supplierId: z.string().uuid(),
  offerExpiresAt: z.string().datetime(),
  proposedPaymentDate: z.string().datetime(),
  originalDueDate: z.string().datetime(),
  discountBps: z.number().int().min(1).max(10000),
  aprBps: z.number().int().min(1).max(50000),
  pricingType: EarlyPaymentPricingTypeSchema.default('APR'),
  invoiceAmountMinor: z.string().min(1),
  discountAmountMinor: z.string().min(1),
  netPaymentAmountMinor: z.string().min(1),
  currency: z.string().length(3),
  glConfigRef: z.string().max(100).optional(),
});
export type CreateEarlyPaymentOffer = z.infer<typeof CreateEarlyPaymentOfferSchema>;

/** Query params for listing early payment offers (supplier portal). */
export const EarlyPaymentOfferListQuerySchema = z.object({
  status: EarlyPaymentOfferStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type EarlyPaymentOfferListQuery = z.infer<typeof EarlyPaymentOfferListQuerySchema>;

/** Paginated list of early payment offers. */
export const EarlyPaymentOfferListResponseSchema = z.object({
  items: z.array(EarlyPaymentOfferSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type EarlyPaymentOfferListResponse = z.infer<typeof EarlyPaymentOfferListResponseSchema>;

// ─── SP-2013: CAP-BULK — Bulk Invoice Upload (P13) ──────────────────────────

export const DedupePolicySchema = z.enum(['SKIP_DUPLICATES', 'UPDATE_DRAFT', 'REJECT_CONFLICTS']);
export type DedupePolicy = z.infer<typeof DedupePolicySchema>;

/** A single row in a bulk invoice upload CSV/JSON payload. */
export const BulkUploadRowSchema = z.object({
  /** Row sequence number in upload (1-indexed, for referencing in results). */
  rowNumber: z.number().int().positive(),
  invoiceNumber: z.string().min(1).max(100),
  /** ISO date string: YYYY-MM-DD */
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  /** Invoice total in major currency units (e.g. "1234.50") */
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Expected decimal amount'),
  currency: z.string().length(3),
  /** Supplier's own reference for matching (PO number, etc.) */
  vendorReference: z.string().max(100).optional().default(''),
  description: z.string().max(500).optional(),
  /** ISO date string: YYYY-MM-DD */
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
        lineTotal: z.string().regex(/^\d+(\.\d{1,4})?$/),
      })
    )
    .optional(),
});
export type BulkUploadRow = z.infer<typeof BulkUploadRowSchema>;

/** Full bulk upload batch request. */
export const BulkUploadBatchSchema = z.object({
  rows: z.array(BulkUploadRowSchema).min(1, 'At least one row required').max(500),
  dedupePolicy: DedupePolicySchema.default('SKIP_DUPLICATES'),
});
export type BulkUploadBatch = z.infer<typeof BulkUploadBatchSchema>;

/** Result status for a single uploaded row. */
export const BulkUploadRowStatusSchema = z.enum([
  'CREATED',
  'SKIPPED_DUPLICATE',
  'UPDATED_DRAFT',
  'REJECTED_CONFLICT',
  'VALIDATION_ERROR',
]);
export type BulkUploadRowStatus = z.infer<typeof BulkUploadRowStatusSchema>;

/** Result for a single row in a bulk upload batch. */
export const BulkUploadRowResultSchema = z.object({
  rowNumber: z.number().int().positive(),
  status: BulkUploadRowStatusSchema,
  /** Created or found invoice ID (if applicable). */
  invoiceId: z.string().uuid().optional(),
  /** SHA-256 fingerprint of the row (for audit). */
  fingerprint: z.string().optional(),
  /** Validation errors or conflict reason. */
  errors: z.array(z.string()).optional(),
});
export type BulkUploadRowResult = z.infer<typeof BulkUploadRowResultSchema>;

/** Full batch response. */
export const BulkUploadResponseSchema = z.object({
  /** Upload batch ID (UUID). */
  batchId: z.string().uuid(),
  totalRows: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  results: z.array(BulkUploadRowResultSchema),
  processedAt: z.string().datetime(),
});
export type BulkUploadResponse = z.infer<typeof BulkUploadResponseSchema>;

// ── CAP-CRDB: Credit / Debit Note ─────────────────────────────────────────────

/** Document type taxonomy for corrections issued by the supplier. */
export const CreditDebitDocumentTypeSchema = z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']);
export type CreditDebitDocumentType = z.infer<typeof CreditDebitDocumentTypeSchema>;

/**
 * Supplier submits a credit or debit note that adjusts a previous invoice.
 * Validates in the same contract-first manner as all other portal submissions.
 */
export const SubmitCreditDebitNoteSchema = z.object({
  documentType: CreditDebitDocumentTypeSchema,
  /** UUID of the original AP invoice this note adjusts. */
  originalInvoiceId: z.string().uuid(),
  /** Supplier-assigned note number — unique per supplier. */
  noteNumber: z.string().min(1).max(64),
  /** YYYY-MM-DD */
  noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  /** Human-readable reason / memo. */
  reason: z.string().min(1).max(500),
  /**
   * Adjustment magnitude in minor currency units (e.g. cents).
   * Always positive — sign is determined by documentType.
   */
  adjustmentAmountMinorUnit: z.string().regex(/^\d+$/, 'Must be a positive integer in minor units'),
  /** ISO-4217 currency code — must match the original invoice currency. */
  currencyCode: z.string().length(3),
  poRef: z.string().max(64).optional(),
});
export type SubmitCreditDebitNote = z.infer<typeof SubmitCreditDebitNoteSchema>;

/** Response returned after a credit/debit note is created. */
export const CreditDebitNoteResponseSchema = z.object({
  id: z.string().uuid(),
  documentType: CreditDebitDocumentTypeSchema,
  noteNumber: z.string(),
  originalInvoiceId: z.string().uuid(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL']),
  adjustmentAmountMinorUnit: z.string(),
  currencyCode: z.string(),
  createdAt: z.string().datetime(),
});
export type CreditDebitNoteResponse = z.infer<typeof CreditDebitNoteResponseSchema>;

// ─── Case View-Model Response Schemas (portal query layer) ──────────────────

/** List-level case view-model — matches PortalCaseListItem in portal.queries.ts */
export const PortalCaseListItemSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  category: z.string(),
  priority: z.string(),
  subject: z.string(),
  status: z.string(),
  assignedTo: z.string().nullable(),
  slaDeadline: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PortalCaseListItem = z.infer<typeof PortalCaseListItemSchema>;

/** Detail-level case view-model — matches PortalCaseDetail in portal.queries.ts */
export const PortalCaseDetailSchema = PortalCaseListItemSchema.extend({
  description: z.string(),
  linkedEntityId: z.string().uuid().nullable(),
  linkedEntityType: z.string().nullable(),
  resolution: z.string().nullable(),
  rootCause: z.string().nullable(),
  correctiveAction: z.string().nullable(),
  resolvedBy: z.string().uuid().nullable(),
  resolvedAt: z.string().datetime().nullable(),
});
export type PortalCaseDetail = z.infer<typeof PortalCaseDetailSchema>;

/** Case timeline entry view-model — matches PortalCaseTimelineEntry in portal.queries.ts */
export const PortalCaseTimelineEntrySchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  entryType: z.string(),
  refId: z.string().uuid().nullable(),
  refType: z.string().nullable(),
  actorId: z.string().uuid(),
  actorType: z.string(),
  content: z.record(z.unknown()).nullable(),
  proofHash: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type PortalCaseTimelineEntry = z.infer<typeof PortalCaseTimelineEntrySchema>;

// ─── Payment Status Timeline (portal query layer) ────────────────────────────

/** A single step in a payment run's status timeline — supplier-visible */
export const PaymentStatusTimelineItemSchema = z.object({
  id: z.string().uuid(),
  stage: PaymentStageSchema,
  previousStage: PaymentStageSchema.nullable(),
  eventAt: z.string().datetime(),
  source: PaymentSourceSchema,
  supplierVisibleLabel: z.string().nullable(),
  nextActionHref: z.string().url().nullable(),
  linkedCaseId: z.string().uuid().nullable(),
  isOnHold: z.boolean(),
  holdDurationDays: z.number().int().nonnegative().nullable(),
});
export type PaymentStatusTimelineItem = z.infer<typeof PaymentStatusTimelineItemSchema>;

/** Paginated payment status timeline response */
export const PaymentStatusTimelineResponseSchema = z.object({
  items: z.array(PaymentStatusTimelineItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  currentStage: PaymentStageSchema.nullable(),
  supplierVisibleLabel: z.string().nullable(),
});
export type PaymentStatusTimelineResponse = z.infer<typeof PaymentStatusTimelineResponseSchema>;

/** Current (latest) payment status snapshot for a payment run */
export const CurrentPaymentStatusSchema = z.object({
  stage: PaymentStageSchema,
  supplierVisibleLabel: z.string(),
  nextActionHref: z.string().url().nullable(),
  isOnHold: z.boolean(),
  holdDurationDays: z.number().int().nonnegative().nullable(),
  linkedCaseId: z.string().uuid().nullable(),
  lastUpdatedAt: z.string().datetime(),
});
export type CurrentPaymentStatus = z.infer<typeof CurrentPaymentStatusSchema>;

// ─── Proof Chain Entry (portal query layer) ──────────────────────────────────

/** A single tamper-evident proof chain entry — supplier-facing */
export const ProofChainEntrySchema = z.object({
  id: z.string().uuid(),
  chainPosition: z.string(), // bigint serialised as string
  eventType: z.string(),
  entityId: z.string().uuid(),
  entityType: z.string(),
  actorId: z.string().uuid(),
  actorType: z.string(),
  eventAt: z.string().datetime(),
  contentHash: z.string(),
  previousHash: z.string().nullable(),
  payloadSummary: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ProofChainEntry = z.infer<typeof ProofChainEntrySchema>;

/** Paginated proof chain response */
export const ProofChainResponseSchema = z.object({
  items: z.array(ProofChainEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type ProofChainResponse = z.infer<typeof ProofChainResponseSchema>;

// ─── Webhook Subscription (portal query layer) ───────────────────────────────

/** A portal webhook subscription (read view-model) */
export const PortalWebhookSubscriptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  endpointUrl: z.string().url(),
  eventTypes: z.array(z.string()),
  status: z.enum(['ACTIVE', 'PAUSED', 'SUSPENDED', 'DELETED']),
  failureCount: z.number().int().nonnegative(),
  lastDeliveredAt: z.string().datetime().nullable(),
  lastFailedAt: z.string().datetime().nullable(),
  lastFailureReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PortalWebhookSubscription = z.infer<typeof PortalWebhookSubscriptionSchema>;

// ─── Supplier Association (portal query layer) ───────────────────────────────

/** A supplier↔tenant association for multi-entity portal users */
export const PortalSupplierAssociationSchema = z.object({
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  supplierCode: z.string(),
  tenantId: z.string().uuid(),
  tenantName: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
});
export type PortalSupplierAssociation = z.infer<typeof PortalSupplierAssociationSchema>;
