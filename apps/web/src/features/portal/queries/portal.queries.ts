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
  itemType: string;
  status: string;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  notes: string | null;
}

export interface PortalComplianceSummary {
  items: PortalComplianceItem[];
  overallStatus: string;
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

// ─── Helper: build supplier base path ──────────────────────────────────────

function supplierPath(supplierId: string): string {
  return `/portal/suppliers/${supplierId}`;
}

// ─── Queries ───────────────────────────────────────────────────────────────

export async function getPortalSupplier(ctx: RequestContext): Promise<ApiResult<PortalSupplier>> {
  const client = createApiClient(ctx);
  return client.get<PortalSupplier>('/portal/me');
}

export async function getPortalDashboard(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalDashboardSummary>> {
  const client = createApiClient(ctx);
  return client.get<PortalDashboardSummary>(`${supplierPath(supplierId)}/dashboard`);
}

export async function getPortalInvoices(
  ctx: RequestContext,
  supplierId: string,
  params?: { page?: string; limit?: string; status?: string }
): Promise<ApiResult<PaginatedResponse<PortalInvoiceListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.status) query.status = params.status;
  return client.get<PaginatedResponse<PortalInvoiceListItem>>(
    `${supplierPath(supplierId)}/invoices`,
    Object.keys(query).length > 0 ? query : undefined
  );
}

export async function getPortalInvoiceDetail(
  ctx: RequestContext,
  supplierId: string,
  invoiceId: string
): Promise<ApiResult<PortalInvoiceDetail>> {
  const client = createApiClient(ctx);
  return client.get<PortalInvoiceDetail>(`${supplierPath(supplierId)}/invoices/${invoiceId}`);
}

export async function getPortalAging(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalAgingBucket[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalAgingBucket[]>(`${supplierPath(supplierId)}/aging`);
}

export async function getPortalPaymentRuns(
  ctx: RequestContext,
  supplierId: string,
  params?: { page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<PortalPaymentRunListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PortalPaymentRunListItem>>(
    `${supplierPath(supplierId)}/payment-runs`,
    Object.keys(query).length > 0 ? query : undefined
  );
}

export async function getPortalRemittance(
  ctx: RequestContext,
  supplierId: string,
  runId: string
): Promise<ApiResult<PortalRemittanceAdvice>> {
  const client = createApiClient(ctx);
  return client.get<PortalRemittanceAdvice>(
    `${supplierPath(supplierId)}/payment-runs/${runId}/remittance`
  );
}

export async function getPortalBankAccounts(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalBankAccount[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalBankAccount[]>(`${supplierPath(supplierId)}/bank-accounts`);
}

export async function getPortalWhtCertificates(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalWhtCertificate[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalWhtCertificate[]>(`${supplierPath(supplierId)}/wht-certificates`);
}

export async function getPortalWhtCertificateDetail(
  ctx: RequestContext,
  supplierId: string,
  certId: string
): Promise<ApiResult<PortalWhtCertificate>> {
  const client = createApiClient(ctx);
  return client.get<PortalWhtCertificate>(`${supplierPath(supplierId)}/wht-certificates/${certId}`);
}

export async function getPortalDocuments(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalDocument[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalDocument[]>(`${supplierPath(supplierId)}/documents`);
}

export async function getPortalDisputes(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalDispute[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalDispute[]>(`${supplierPath(supplierId)}/disputes`);
}

export async function getPortalDisputeDetail(
  ctx: RequestContext,
  supplierId: string,
  disputeId: string
): Promise<ApiResult<PortalDispute>> {
  const client = createApiClient(ctx);
  return client.get<PortalDispute>(`${supplierPath(supplierId)}/disputes/${disputeId}`);
}

export async function getPortalCompliance(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalComplianceSummary>> {
  const client = createApiClient(ctx);
  return client.get<PortalComplianceSummary>(`${supplierPath(supplierId)}/compliance`);
}

export async function getPortalNotificationPrefs(
  ctx: RequestContext,
  supplierId: string
): Promise<ApiResult<PortalNotificationPref[]>> {
  const client = createApiClient(ctx);
  return client.get<PortalNotificationPref[]>(`${supplierPath(supplierId)}/notification-prefs`);
}

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
