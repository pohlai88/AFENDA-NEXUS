import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── Request Context ───────────────────────────────────────────────────────

interface RequestContext {
  tenantId: string;
  userId?: string;
  token?: string;
}

// ─── View Models ───────────────────────────────────────────────────────────

export interface PortalSupplier {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  taxId: string | null;
  remittanceEmail: string | null;
  currencyCode: string;
}

export interface PortalInvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  currencyCode: string;
}

export interface PortalInvoiceDetail extends PortalInvoiceListItem {
  supplierRef: string | null;
  description: string | null;
  lines: PortalInvoiceLine[];
}

export interface PortalInvoiceLine {
  id: string;
  lineNumber: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  taxCode: string | null;
  taxAmount: string;
}

export interface PortalAgingBucket {
  label: string;
  count: number;
  totalAmount: string;
  currencyCode: string;
}

export interface PortalPaymentRunListItem {
  id: string;
  runNumber: string;
  runDate: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  invoiceCount: number;
}

export interface PortalRemittanceItem {
  invoiceId: string;
  invoiceNumber: string;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
}

export interface PortalRemittanceAdvice {
  paymentRunId: string;
  runNumber: string;
  runDate: string;
  currencyCode: string;
  supplierName: string;
  items: PortalRemittanceItem[];
  totalGross: string;
  totalDiscount: string;
  totalNet: string;
}

export interface PortalBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string | null;
  swiftBic: string | null;
  currencyCode: string;
  isPrimary: boolean;
}

export interface PortalDocument {
  id: string;
  category: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface PortalDispute {
  id: string;
  invoiceId: string | null;
  paymentRunId: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Case View Models ──────────────────────────────────────────────────────

export interface PortalCaseListItem {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  status: string;
  assignedTo: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalCaseDetail extends PortalCaseListItem {
  description: string;
  linkedEntityId: string | null;
  linkedEntityType: string | null;
  resolution: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface PortalCaseTimelineEntry {
  id: string;
  caseId: string;
  entryType: string;
  refId: string | null;
  refType: string | null;
  actorId: string;
  actorType: string;
  content: Record<string, unknown> | null;
  proofHash: string | null;
  createdAt: string;
}

export interface PortalWhtCertificate {
  id: string;
  invoiceId: string;
  certificateNumber: string;
  whtAmount: string;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
}

export interface PortalComplianceItem {
  id: string;
  itemType: string;
  label?: string;
  status: string;
  isCompliant: boolean;
  issuedDate: string | null;
  expiryDate: string | null;
  documentId: string | null;
  daysUntilExpiry: number | null;
  lastVerifiedBy: string | null;
  lastVerifiedAt: string | null;
  notes: string | null;
}

export interface PortalComplianceSummary {
  supplierId: string;
  items: PortalComplianceItem[];
  overallStatus: string;
  expiredCount: number;
  expiringSoonCount: number;
  pendingCount: number;
}

// ─── Compliance Alert Types (Phase 1.1.3 CAP-COMPL) ────────────────────────

export interface PortalComplianceAlertLog {
  id: string;
  complianceItemId: string;
  itemType: string;
  alertType: string;
  alertedAt: string;
  supersededAt: string | null;
}

export interface PortalComplianceTimelineEntry {
  id: string;
  itemType: string;
  eventType: string;
  actorId: string | null;
  actorType: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

// ─── Location Directory Types (Phase 1.1.5 CAP-LOC) ────────────────────────

export type LocationType = 'HQ' | 'WAREHOUSE' | 'BILLING' | 'SHIPPING' | 'BRANCH';

export interface PortalLocation {
  id: string;
  name: string;
  locationType: LocationType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  country: string;
  latitude: string | null;
  longitude: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  businessHoursStart: string | null;
  businessHoursEnd: string | null;
  timezone: string | null;
  notes: string | null;
  isActive: boolean;
}

// ─── Management Directory Types (Phase 1.1.6 CAP-DIR) ──────────────────────

export type Department =
  | 'ACCOUNTS_PAYABLE'
  | 'PROCUREMENT'
  | 'COMPLIANCE'
  | 'FINANCE_MANAGEMENT'
  | 'EXECUTIVE'
  | 'OPERATIONS'
  | 'LEGAL';

export interface PortalDirectoryEntry {
  id: string;
  fullName: string;
  title: string;
  department: Department;
  emailAddress: string;
  masked: boolean;
  phoneNumber: string | null;
  availability: string | null;
  timezone: string | null;
  bio: string | null;
  isEscalationContact: boolean;
}

export interface PortalNotificationPref {
  eventType: string;
  channel: string;
  enabled: boolean;
  webhookUrl: string | null;
}

export interface PortalReconResult {
  matchedCount: number;
  unmatchedCount: number;
  statementOnlyCount: number;
  matched: PortalReconLine[];
  unmatched: PortalReconLine[];
  statementOnly: PortalReconLine[];
}

export interface PortalReconLine {
  statementRef: string;
  statementAmount: string;
  ledgerRef: string | null;
  ledgerAmount: string | null;
  status: string;
}

export interface PortalDashboardSummary {
  openInvoiceCount: number;
  openInvoiceAmount: string;
  overdueInvoiceCount: number;
  overdueInvoiceAmount: string;
  paidLast30Count: number;
  paidLast30Amount: string;
  currencyCode: string;
  aging: PortalAgingBucket[];
  compliance: PortalComplianceSummary;
  recentInvoices: PortalInvoiceListItem[];
  openDisputes: PortalDispute[];
}

export type OnboardingStep =
  | 'company_info'
  | 'bank_details'
  | 'kyc_documents'
  | 'tax_registration'
  | 'review';

export type OnboardingStatus =
  | 'PROSPECT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

export interface PortalOnboardingSubmission {
  id: string;
  supplierId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  companyInfoDraft: Record<string, unknown> | null;
  bankDetailsDraft: Record<string, unknown> | null;
  kycDocumentsDraft: Record<string, unknown> | null;
  taxRegistrationDraft: Record<string, unknown> | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  onboardingStatus: OnboardingStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
}

// ─── Helper: build supplier base path ──────────────────────────────────────

function supplierPath(supplierId: string): string {
  return `/portal/suppliers/${supplierId}`;
}

// ─── Queries ───────────────────────────────────────────────────────────────

export const getPortalSupplier = cache(
  async (ctx: RequestContext): Promise<ApiResult<PortalSupplier>> => {
    const client = createApiClient(ctx);
    return client.get<PortalSupplier>('/portal/me');
  }
);

export const getPortalDashboard = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalDashboardSummary>> => {
    const client = createApiClient(ctx);
    return client.get<PortalDashboardSummary>(`${supplierPath(supplierId)}/dashboard`);
  }
);

export const getPortalInvoices = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: {
      page?: string;
      limit?: string;
      status?: string;
      q?: string;
      from?: string;
      to?: string;
    }
  ): Promise<ApiResult<PaginatedResponse<PortalInvoiceListItem>>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.status) query.status = params.status;
    if (params?.q) query.q = params.q;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    return client.get<PaginatedResponse<PortalInvoiceListItem>>(
      `${supplierPath(supplierId)}/invoices`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalInvoiceDetail = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    invoiceId: string
  ): Promise<ApiResult<PortalInvoiceDetail>> => {
    const client = createApiClient(ctx);
    return client.get<PortalInvoiceDetail>(`${supplierPath(supplierId)}/invoices/${invoiceId}`);
  }
);

export const getPortalAging = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalAgingBucket[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalAgingBucket[]>(`${supplierPath(supplierId)}/aging`);
  }
);

export const getPortalPaymentRuns = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { page?: string; limit?: string }
  ): Promise<ApiResult<PaginatedResponse<PortalPaymentRunListItem>>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    return client.get<PaginatedResponse<PortalPaymentRunListItem>>(
      `${supplierPath(supplierId)}/payment-runs`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalRemittance = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    runId: string
  ): Promise<ApiResult<PortalRemittanceAdvice>> => {
    const client = createApiClient(ctx);
    return client.get<PortalRemittanceAdvice>(
      `${supplierPath(supplierId)}/payment-runs/${runId}/remittance`
    );
  }
);

export const getPortalBankAccounts = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalBankAccount[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalBankAccount[]>(`${supplierPath(supplierId)}/bank-accounts`);
  }
);

export const getPortalWhtCertificates = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalWhtCertificate[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalWhtCertificate[]>(`${supplierPath(supplierId)}/wht-certificates`);
  }
);

export const getPortalWhtCertificateDetail = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    certId: string
  ): Promise<ApiResult<PortalWhtCertificate>> => {
    const client = createApiClient(ctx);
    return client.get<PortalWhtCertificate>(
      `${supplierPath(supplierId)}/wht-certificates/${certId}`
    );
  }
);

export const getPortalDocuments = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalDocument[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalDocument[]>(`${supplierPath(supplierId)}/documents`);
  }
);

export const getPortalDisputes = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalDispute[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalDispute[]>(`${supplierPath(supplierId)}/disputes`);
  }
);

export const getPortalDisputeDetail = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    disputeId: string
  ): Promise<ApiResult<PortalDispute>> => {
    const client = createApiClient(ctx);
    return client.get<PortalDispute>(`${supplierPath(supplierId)}/disputes/${disputeId}`);
  }
);

export const getPortalCompliance = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalComplianceSummary>> => {
    const client = createApiClient(ctx);
    return client.get<PortalComplianceSummary>(`${supplierPath(supplierId)}/compliance`);
  }
);

export const getPortalComplianceAlerts = cache(
  async (
    ctx: RequestContext,
    supplierId: string
  ): Promise<ApiResult<PortalComplianceAlertLog[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalComplianceAlertLog[]>(`${supplierPath(supplierId)}/compliance/alerts`);
  }
);

export const getPortalComplianceTimeline = cache(
  async (
    ctx: RequestContext,
    supplierId: string
  ): Promise<ApiResult<PortalComplianceTimelineEntry[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalComplianceTimelineEntry[]>(
      `${supplierPath(supplierId)}/compliance/timeline`
    );
  }
);

export async function renewPortalComplianceItem(
  ctx: RequestContext,
  supplierId: string,
  itemId: string,
  body: { documentId: string; newExpiryDate: string; notes?: string }
): Promise<ApiResult<PortalComplianceItem>> {
  const client = createApiClient(ctx);
  return client.post<PortalComplianceItem>(
    `${supplierPath(supplierId)}/compliance/${itemId}/renew`,
    body
  );
}

export const getPortalNotificationPrefs = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalNotificationPref[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalNotificationPref[]>(`${supplierPath(supplierId)}/notification-prefs`);
  }
);

// ─── Case Queries ──────────────────────────────────────────────────────────

export const getPortalCases = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: {
      page?: string;
      limit?: string;
      status?: string;
      category?: string;
      priority?: string;
      q?: string;
    }
  ): Promise<ApiResult<PaginatedResponse<PortalCaseListItem>>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.status) query.status = params.status;
    if (params?.category) query.category = params.category;
    if (params?.priority) query.priority = params.priority;
    if (params?.q) query.q = params.q;
    return client.get<PaginatedResponse<PortalCaseListItem>>(
      `${supplierPath(supplierId)}/cases`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalCaseDetail = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    caseId: string
  ): Promise<ApiResult<PortalCaseDetail>> => {
    const client = createApiClient(ctx);
    return client.get<PortalCaseDetail>(`${supplierPath(supplierId)}/cases/${caseId}`);
  }
);

export const getPortalCaseTimeline = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    caseId: string,
    params?: { page?: string; limit?: string; entryType?: string }
  ): Promise<ApiResult<PaginatedResponse<PortalCaseTimelineEntry>>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.entryType) query.entryType = params.entryType;
    return client.get<PaginatedResponse<PortalCaseTimelineEntry>>(
      `${supplierPath(supplierId)}/cases/${caseId}/timeline`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

// ─── Mutations ─────────────────────────────────────────────────────────────

export async function submitPortalInvoice(
  ctx: RequestContext,
  supplierId: string,
  body: { invoices: Record<string, unknown>[] }
): Promise<ApiResult<{ importedCount: number; errors: Record<string, unknown>[] }>> {
  const client = createApiClient(ctx);
  return client.post(`${supplierPath(supplierId)}/invoices/submit`, body);
}

export async function addPortalBankAccount(
  ctx: RequestContext,
  supplierId: string,
  body: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
    swiftBic?: string;
    currencyCode: string;
    isPrimary?: boolean;
  }
): Promise<ApiResult<PortalBankAccount>> {
  const client = createApiClient(ctx);
  return client.post<PortalBankAccount>(`${supplierPath(supplierId)}/bank-accounts`, body);
}

export async function updatePortalProfile(
  ctx: RequestContext,
  supplierId: string,
  body: Record<string, unknown>
): Promise<ApiResult<PortalSupplier>> {
  const client = createApiClient(ctx);
  return client.patch<PortalSupplier>(`${supplierPath(supplierId)}/profile`, body);
}

export async function uploadPortalDocument(
  ctx: RequestContext,
  supplierId: string,
  body: {
    category: string;
    title: string;
    fileName: string;
    mimeType: string;
    content: string;
    expiresAt?: string;
  }
): Promise<ApiResult<PortalDocument>> {
  const client = createApiClient(ctx);
  return client.post<PortalDocument>(`${supplierPath(supplierId)}/documents`, body);
}

export async function createPortalDispute(
  ctx: RequestContext,
  supplierId: string,
  body: {
    invoiceId?: string;
    paymentRunId?: string;
    category: string;
    subject: string;
    description: string;
  }
): Promise<ApiResult<PortalDispute>> {
  const client = createApiClient(ctx);
  return client.post<PortalDispute>(`${supplierPath(supplierId)}/disputes`, body);
}

export async function submitPortalStatementRecon(
  ctx: RequestContext,
  supplierId: string,
  body: { lines: Record<string, unknown>[] }
): Promise<ApiResult<PortalReconResult>> {
  const client = createApiClient(ctx);
  return client.post<PortalReconResult>(`${supplierPath(supplierId)}/statement-recon`, body);
}

export async function updatePortalNotificationPrefs(
  ctx: RequestContext,
  supplierId: string,
  body: { preferences: PortalNotificationPref[] }
): Promise<ApiResult<PortalNotificationPref[]>> {
  const client = createApiClient(ctx);
  return client.put<PortalNotificationPref[]>(
    `${supplierPath(supplierId)}/notification-prefs`,
    body
  );
}

// ─── Case Mutations ────────────────────────────────────────────────────────

export async function createPortalCase(
  ctx: RequestContext,
  supplierId: string,
  body: {
    category: string;
    priority: string;
    subject: string;
    description: string;
    linkedEntityId?: string;
    linkedEntityType?: string;
  }
): Promise<ApiResult<PortalCaseDetail>> {
  const client = createApiClient(ctx);
  return client.post<PortalCaseDetail>(`${supplierPath(supplierId)}/cases`, body);
}

export async function addPortalCaseTimelineMessage(
  ctx: RequestContext,
  supplierId: string,
  caseId: string,
  body: { content: string }
): Promise<ApiResult<PortalCaseTimelineEntry>> {
  const client = createApiClient(ctx);
  return client.post<PortalCaseTimelineEntry>(
    `${supplierPath(supplierId)}/cases/${caseId}/timeline`,
    body
  );
}

// ─── Onboarding Queries & Mutations (Phase 1.1.2 CAP-ONB) ───────────────

export const getPortalOnboarding = cache(
  async (
    ctx: RequestContext,
    supplierId: string
  ): Promise<ApiResult<PortalOnboardingSubmission>> => {
    const client = createApiClient(ctx);
    return client.get<PortalOnboardingSubmission>(`${supplierPath(supplierId)}/onboarding`);
  }
);

export async function savePortalOnboardingDraft(
  ctx: RequestContext,
  supplierId: string,
  body: { step: OnboardingStep; draft: Record<string, unknown> }
): Promise<ApiResult<PortalOnboardingSubmission>> {
  const client = createApiClient(ctx);
  return client.put<PortalOnboardingSubmission>(
    `${supplierPath(supplierId)}/onboarding/draft`,
    body
  );
}

export async function submitPortalOnboarding(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalOnboardingSubmission>> {
  const client = createApiClient(ctx);
  return client.post<PortalOnboardingSubmission>(
    `${supplierPath(supplierId)}/onboarding/submit`,
    {}
  );
}

// ─── Audit Trail Query (Phase 1.1.4 CAP-AUDIT) ─────────────────────────

export interface PortalAuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actorId: string | null;
  ipAddress: string | null;
  occurredAt: string;
  description: string;
}

export interface PortalAuditLogList {
  items: PortalAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export const getPortalActivity = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { page?: string; limit?: string; action?: string; resource?: string }
  ): Promise<ApiResult<PortalAuditLogList>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.action) query.action = params.action;
    if (params?.resource) query.resource = params.resource;
    return client.get<PortalAuditLogList>(
      `${supplierPath(supplierId)}/activity`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

// ─── Location Directory Queries (Phase 1.1.5 CAP-LOC) ──────────────────────

export const getPortalLocations = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { locationType?: LocationType; includeInactive?: boolean }
  ): Promise<ApiResult<PortalLocation[]>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.locationType) query.locationType = params.locationType;
    if (params?.includeInactive !== undefined) {
      query.includeInactive = params.includeInactive.toString();
    }
    return client.get<PortalLocation[]>(
      `${supplierPath(supplierId)}/locations`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalLocationById = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    locationId: string
  ): Promise<ApiResult<PortalLocation>> => {
    const client = createApiClient(ctx);
    return client.get<PortalLocation>(`${supplierPath(supplierId)}/locations/${locationId}`);
  }
);

// ─── Management Directory Queries (Phase 1.1.6 CAP-DIR) ────────────────────

export const getPortalDirectory = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { department?: Department; escalationOnly?: boolean }
  ): Promise<ApiResult<PortalDirectoryEntry[]>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.department) query.department = params.department;
    if (params?.escalationOnly !== undefined) {
      query.escalationOnly = params.escalationOnly.toString();
    }
    return client.get<PortalDirectoryEntry[]>(
      `${supplierPath(supplierId)}/directory`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalDirectoryEntry = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    entryId: string
  ): Promise<ApiResult<PortalDirectoryEntry>> => {
    const client = createApiClient(ctx);
    return client.get<PortalDirectoryEntry>(`${supplierPath(supplierId)}/directory/${entryId}`);
  }
);

// ─── Messaging Hub Queries (Phase 1.2.1 CAP-MSG) ───────────────────────────

export type SenderType = 'SUPPLIER' | 'BUYER';

export interface PortalMessageThread {
  id: string;
  tenantId: string;
  caseId: string;
  supplierId: string;
  subject: string;
  lastMessageAt: string | null;
  lastMessageBy: SenderType | null;
  supplierUnreadCount: number;
  buyerUnreadCount: number;
  isSupplierArchived: boolean;
  isBuyerArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalMessage {
  id: string;
  tenantId: string;
  threadId: string;
  body: string;
  senderType: SenderType;
  senderId: string;
  readAt: string | null;
  readBy: string | null;
  attachmentIds: string[];
  idempotencyKey: string;
  proofHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalThreadListResponse {
  items: PortalMessageThread[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PortalMessageListResponse {
  items: PortalMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getPortalMessageThreads = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { caseId?: string; includeArchived?: boolean; page?: string; limit?: string }
  ): Promise<ApiResult<PortalThreadListResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.caseId) query.caseId = params.caseId;
    if (params?.includeArchived !== undefined)
      query.includeArchived = params.includeArchived.toString();
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    return client.get<PortalThreadListResponse>(
      `${supplierPath(supplierId)}/messages/threads`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalMessages = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    threadId: string,
    params?: { page?: string; limit?: string }
  ): Promise<ApiResult<PortalMessageListResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    return client.get<PortalMessageListResponse>(
      `${supplierPath(supplierId)}/messages/threads/${threadId}/messages`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export async function startPortalMessageThread(
  ctx: RequestContext,
  supplierId: string,
  body: {
    caseId?: string;
    subject: string;
    initialMessageBody: string;
    attachmentIds?: string[];
    idempotencyKey: string;
  }
): Promise<ApiResult<PortalMessageThread>> {
  const client = createApiClient(ctx);
  return client.post<PortalMessageThread>(`${supplierPath(supplierId)}/messages/threads`, body);
}

export async function sendPortalMessage(
  ctx: RequestContext,
  supplierId: string,
  threadId: string,
  body: {
    body: string;
    attachmentIds?: string[];
    idempotencyKey: string;
  }
): Promise<ApiResult<PortalMessage>> {
  const client = createApiClient(ctx);
  return client.post<PortalMessage>(
    `${supplierPath(supplierId)}/messages/threads/${threadId}/messages`,
    body
  );
}

export async function markPortalMessageRead(
  ctx: RequestContext,
  supplierId: string,
  messageId: string,
  readBy: string
): Promise<ApiResult<PortalMessage>> {
  const client = createApiClient(ctx);
  return client.patch<PortalMessage>(`${supplierPath(supplierId)}/messages/${messageId}/read`, {
    readBy,
  });
}

// ─── Escalation Types (Phase 1.2.2 CAP-SOS) ────────────────────────────────

export type EscalationStatus =
  | 'ESCALATION_REQUESTED'
  | 'ESCALATION_ASSIGNED'
  | 'ESCALATION_IN_PROGRESS'
  | 'ESCALATION_RESOLVED';

export interface PortalEscalationSla {
  respondByAt: string;
  resolveByAt: string;
  respondSlaBreached: boolean;
  resolveSlaBreached: boolean;
  hoursUntilRespond: number;
  hoursUntilResolve: number;
}

export interface PortalEscalation {
  id: string;
  tenantId: string;
  caseId: string;
  supplierId: string;
  triggeredBy: string;
  assignedTo: string | null;
  assignedAt: string | null;
  status: EscalationStatus;
  reason: string;
  respondByAt: string;
  resolveByAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  proofHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalEscalationDetail extends PortalEscalation {
  sla: PortalEscalationSla;
}

export interface PortalEscalationListResponse {
  items: PortalEscalation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Escalation Queries (Phase 1.2.2 CAP-SOS) ─────────────────────────────

export const getPortalEscalations = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { page?: string; limit?: string; status?: string; caseId?: string }
  ): Promise<ApiResult<PortalEscalationListResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.status) query.status = params.status;
    if (params?.caseId) query.caseId = params.caseId;
    return client.get<PortalEscalationListResponse>(
      `${supplierPath(supplierId)}/escalations`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

export const getPortalEscalationDetail = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    escalationId: string
  ): Promise<ApiResult<PortalEscalationDetail>> => {
    const client = createApiClient(ctx);
    return client.get<PortalEscalationDetail>(
      `${supplierPath(supplierId)}/escalations/${escalationId}`
    );
  }
);

// ─── Escalation Mutations (Phase 1.2.2 CAP-SOS) ───────────────────────────

export async function triggerPortalEscalation(
  ctx: RequestContext,
  supplierId: string,
  body: { caseId: string; reason: string }
): Promise<ApiResult<PortalEscalation>> {
  const client = createApiClient(ctx);
  return client.post<PortalEscalation>(`${supplierPath(supplierId)}/escalations`, body);
}

export async function resolvePortalEscalation(
  ctx: RequestContext,
  supplierId: string,
  escalationId: string,
  body: { resolutionNotes: string }
): Promise<ApiResult<PortalEscalation>> {
  const client = createApiClient(ctx);
  return client.patch<PortalEscalation>(
    `${supplierPath(supplierId)}/escalations/${escalationId}/resolve`,
    body
  );
}

// ─── SP-2010: CAP-ANNOUNCE — Announcement Types + Queries ─────────────────

export type AnnouncementSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface PortalAnnouncement {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  pinned: boolean;
  validFrom: string;
  validUntil: string | null;
  createdBy: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  items: PortalAnnouncement[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Supplier reads active announcements (filtered by validity window, not archived). */
export const getPortalAnnouncements = cache(
  async (ctx: RequestContext, supplierId: string): Promise<ApiResult<PortalAnnouncement[]>> => {
    const client = createApiClient(ctx);
    return client.get<PortalAnnouncement[]>(`${supplierPath(supplierId)}/announcements`);
  }
);

/** Buyer admin lists all announcements with optional filters. */
export const getAllPortalAnnouncements = cache(
  async (
    ctx: RequestContext,
    params?: {
      pinned?: boolean;
      severity?: AnnouncementSeverity;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResult<AnnouncementListResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.pinned !== undefined) query.pinned = String(params.pinned);
    if (params?.severity) query.severity = params.severity;
    if (params?.includeArchived !== undefined)
      query.includeArchived = String(params.includeArchived);
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    return client.get<AnnouncementListResponse>(
      '/portal/announcements',
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

/** Buyer admin creates an announcement. */
export async function createPortalAnnouncement(
  ctx: RequestContext,
  body: {
    title: string;
    body: string;
    severity?: AnnouncementSeverity;
    pinned?: boolean;
    validFrom?: string;
    validUntil?: string | null;
  }
): Promise<ApiResult<PortalAnnouncement>> {
  const client = createApiClient(ctx);
  return client.post<PortalAnnouncement>('/portal/announcements', body);
}

/** Buyer admin updates an announcement. */
export async function updatePortalAnnouncement(
  ctx: RequestContext,
  announcementId: string,
  body: Partial<{
    title: string;
    body: string;
    severity: AnnouncementSeverity;
    pinned: boolean;
    validFrom: string;
    validUntil: string | null;
  }>
): Promise<ApiResult<PortalAnnouncement>> {
  const client = createApiClient(ctx);
  return client.patch<PortalAnnouncement>(`/portal/announcements/${announcementId}`, body);
}

/** Buyer admin archives (soft-deletes) an announcement. */
export async function archivePortalAnnouncement(
  ctx: RequestContext,
  announcementId: string
): Promise<ApiResult<void>> {
  const client = createApiClient(ctx);
  return client.delete<void>(`/portal/announcements/${announcementId}`);
}

// ─── SP-6000: CAP-PROOF (P25) — Proof Chain Verification ───────────────────

export interface ProofChainEntry {
  id: string;
  chainPosition: string; // returned as string (bigint serialized)
  eventType: string;
  entityId: string;
  entityType: string;
  actorId: string;
  actorType: string;
  eventAt: string;
  contentHash: string;
  previousHash: string | null;
  payloadSummary: string | null;
  createdAt: string;
}

export interface ProofChainResponse {
  items: ProofChainEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Supplier reads the tamper-evident proof chain for their own entity. */
export const getPortalProofChain = cache(async function (
  ctx: RequestContext,
  supplierId: string,
  opts: { page?: number; limit?: number } = {}
): Promise<ApiResult<ProofChainResponse>> {
  const client = createApiClient(ctx);
  const params = new URLSearchParams({
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 50),
  });
  return client.get<ProofChainResponse>(`/portal/suppliers/${supplierId}/proof?${params}`);
});

// ─── SP-5020: CAP-APPT (P27) — Appointment Scheduling ─────────────────────

export type MeetingRequestStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type MeetingType = 'VIRTUAL' | 'IN_PERSON';

export interface PortalMeetingRequest {
  id: string;
  tenantId: string;
  requestedBy: string;
  supplierId: string;
  requestedWith: string | null;
  meetingType: MeetingType;
  agenda: string;
  location: string | null;
  proposedTimes: string[];
  confirmedTime: string | null;
  durationMinutes: string;
  caseId: string | null;
  escalationId: string | null;
  status: MeetingRequestStatus;
  cancellationReason: string | null;
  buyerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingRequestListResponse {
  items: PortalMeetingRequest[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Supplier lists their own meeting requests, optionally filtered by status. */
export const getPortalAppointments = cache(async function (
  ctx: RequestContext,
  supplierId: string,
  opts: { status?: MeetingRequestStatus; page?: number; limit?: number } = {}
): Promise<ApiResult<MeetingRequestListResponse>> {
  const client = createApiClient(ctx);
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  params.set('page', String(opts.page ?? 1));
  params.set('limit', String(opts.limit ?? 20));
  return client.get<MeetingRequestListResponse>(
    `${supplierPath(supplierId)}/appointments?${params}`
  );
});

/** Get a single meeting request. */
export const getPortalAppointmentDetail = cache(async function (
  ctx: RequestContext,
  meetingId: string
): Promise<ApiResult<PortalMeetingRequest>> {
  const client = createApiClient(ctx);
  return client.get<PortalMeetingRequest>(`/portal/appointments/${meetingId}`);
});

/** Supplier creates a new meeting request. */
export async function createPortalAppointment(
  ctx: RequestContext,
  supplierId: string,
  body: {
    requestedWith?: string;
    meetingType?: MeetingType;
    agenda: string;
    location?: string;
    proposedTimes: string[];
    durationMinutes?: string;
    caseId?: string;
    escalationId?: string;
  }
): Promise<ApiResult<PortalMeetingRequest>> {
  const client = createApiClient(ctx);
  return client.post<PortalMeetingRequest>(`${supplierPath(supplierId)}/appointments`, body);
}

/** Either party cancels a meeting request. */
export async function cancelPortalAppointment(
  ctx: RequestContext,
  meetingId: string,
  body: { cancellationReason?: string }
): Promise<ApiResult<PortalMeetingRequest>> {
  const client = createApiClient(ctx);
  return client.post<PortalMeetingRequest>(`/portal/appointments/${meetingId}/cancel`, body);
}

// ─── CAP-PAY-ETA: Payment Status Tracking ─────────────────────────────────

export type PaymentStage =
  | 'SCHEDULED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SENT'
  | 'CLEARED'
  | 'ON_HOLD'
  | 'REJECTED';

export type PaymentSource = 'BANK_FILE' | 'ERP' | 'MANUAL_OVERRIDE';

export interface PaymentStatusTimelineItem {
  id: string;
  stage: PaymentStage;
  previousStage: PaymentStage | null;
  eventAt: string; // ISO string
  source: PaymentSource;
  supplierVisibleLabel: string | null;
  nextActionHref: string | null;
  linkedCaseId: string | null;
  isOnHold: boolean;
  holdDurationDays: number | null;
}

export interface PaymentStatusTimelineResponse {
  items: PaymentStatusTimelineItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  currentStage: PaymentStage | null;
  supplierVisibleLabel: string | null;
}

export interface CurrentPaymentStatus {
  stage: PaymentStage;
  supplierVisibleLabel: string;
  nextActionHref: string | null;
  isOnHold: boolean;
  holdDurationDays: number | null;
  linkedCaseId: string | null;
  lastUpdatedAt: string; // ISO string
}

/** Get full payment status timeline for a payment run. */
export const getPortalPaymentStatusTimeline = cache(
  async (
    ctx: RequestContext,
    paymentRunId: string,
    params?: { page?: number; limit?: number; invoiceId?: string }
  ): Promise<ApiResult<PaymentStatusTimelineResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    if (params?.invoiceId) query.invoiceId = params.invoiceId;
    return client.get<PaymentStatusTimelineResponse>(
      `/portal/payment-runs/${paymentRunId}/status-timeline`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

/** Get lightweight current payment stage for a payment run. */
export const getPortalCurrentPaymentStatus = cache(
  async (
    ctx: RequestContext,
    paymentRunId: string
  ): Promise<ApiResult<CurrentPaymentStatus | null>> => {
    const client = createApiClient(ctx);
    return client.get<CurrentPaymentStatus | null>(
      `/portal/payment-runs/${paymentRunId}/current-status`
    );
  }
);

/** Get invoice-level payment status (for invoice detail pages). */
export const getPortalInvoicePaymentStatus = cache(
  async (
    ctx: RequestContext,
    invoiceId: string
  ): Promise<ApiResult<CurrentPaymentStatus | null>> => {
    const client = createApiClient(ctx);
    return client.get<CurrentPaymentStatus | null>(`/portal/invoices/${invoiceId}/payment-status`);
  }
);

// ─── CAP-SCF: Early Payment Offers ──────────────────────────────────────────

export type EarlyPaymentOfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type EarlyPaymentPricingType = 'APR' | 'FLAT';

export interface EarlyPaymentOffer {
  id: string;
  invoiceId: string;
  supplierId: string;
  offerExpiresAt: string;
  proposedPaymentDate: string;
  originalDueDate: string;
  discountBps: number;
  aprBps: number;
  pricingType: EarlyPaymentPricingType;
  invoiceAmountMinor: string;
  discountAmountMinor: string;
  netPaymentAmountMinor: string;
  currency: string;
  status: EarlyPaymentOfferStatus;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EarlyPaymentOfferListResponse {
  items: EarlyPaymentOffer[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** List early payment offers available to a supplier. */
export const getPortalEarlyPaymentOffers = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    params?: { status?: EarlyPaymentOfferStatus; page?: number; limit?: number }
  ): Promise<ApiResult<EarlyPaymentOfferListResponse>> => {
    const client = createApiClient(ctx);
    const query: Record<string, string> = {};
    if (params?.status) query.status = params.status;
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    return client.get<EarlyPaymentOfferListResponse>(
      `/portal/suppliers/${supplierId}/early-payment-offers`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }
);

/** Get a single early payment offer by ID. */
export const getPortalEarlyPaymentOffer = cache(
  async (
    ctx: RequestContext,
    supplierId: string,
    offerId: string
  ): Promise<ApiResult<EarlyPaymentOffer>> => {
    const client = createApiClient(ctx);
    return client.get<EarlyPaymentOffer>(
      `/portal/suppliers/${supplierId}/early-payment-offers/${offerId}`
    );
  }
);

// ─── Webhook Subscription Queries (SP-7015) ───────────────────────────────

export interface PortalWebhookSubscription {
  id: string;
  label: string;
  endpointUrl: string;
  eventTypes: string[];
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'DELETED';
  failureCount: number;
  lastDeliveredAt: string | null;
  lastFailedAt: string | null;
  lastFailureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** List all (non-deleted) webhook subscriptions for a supplier. */
export const getPortalWebhooks = cache(
  async (
    ctx: RequestContext,
    supplierId: string
  ): Promise<ApiResult<PortalWebhookSubscription[]>> => {
    const client = createApiClient(ctx);
    const result = await client.get<{ data: PortalWebhookSubscription[] }>(
      `${supplierPath(supplierId)}/webhooks`
    );
    if (!result.ok) return result;
    return { ok: true, value: result.value.data };
  }
);

// ─── Multi-Entity Association Queries (SP-7016) ───────────────────────────

export interface PortalSupplierAssociation {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  tenantId: string;
  tenantName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

/** List all supplier/tenant associations for the current user. */
export const getPortalAssociations = cache(
  async (ctx: RequestContext): Promise<ApiResult<PortalSupplierAssociation[]>> => {
    const client = createApiClient(ctx);
    const result = await client.get<{ data: PortalSupplierAssociation[] }>(
      '/portal/me/associations'
    );
    if (!result.ok) return result;
    return { ok: true, value: result.value.data };
  }
);
