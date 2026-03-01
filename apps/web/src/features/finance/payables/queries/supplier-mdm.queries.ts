import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

type Ctx = { tenantId: string; userId: string; token: string };

// ─── View Models ────────────────────────────────────────────────────────────

export interface SupplierBlockView {
  id: string;
  blockType: string;
  blockScope: string;
  reason: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SupplierTaxRegistrationView {
  id: string;
  taxType: string;
  registrationNumber: string;
  countryCode: string;
  issuingAuthority: string | null;
  validFrom: string;
  validTo: string | null;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface SupplierLegalDocView {
  id: string;
  docType: string;
  documentName: string;
  fileUrl: string | null;
  status: string;
  expiryDate: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
}

export interface SupplierEvaluationView {
  id: string;
  templateName: string;
  evaluatorName: string;
  status: string;
  overallScore: number | null;
  period: string;
  completedAt: string | null;
  createdAt: string;
}

export interface SupplierRiskIndicatorView {
  id: string;
  riskCategory: string;
  riskRating: string;
  description: string;
  mitigationPlan: string | null;
  isActive: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export interface SupplierDiversityView {
  id: string;
  diversityCode: string;
  certificationBody: string | null;
  certificationNumber: string | null;
  validFrom: string;
  validTo: string | null;
  verified: boolean;
}

export interface SupplierContactView {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface SupplierCompanyOverrideView {
  id: string;
  companyId: string;
  companyName: string;
  paymentTermsOverride: string | null;
  paymentMethodOverride: string | null;
  currencyOverride: string | null;
  whtRateOverride: string | null;
  updatedAt: string;
}

export interface SupplierActivationReadiness {
  ready: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

// ─── Query Functions — Blocks ───────────────────────────────────────────────

export async function getSupplierBlocks(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierBlockView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierBlockView[] }>(`/ap/suppliers/${supplierId}/blocks`);
}

export async function getSupplierBlockHistory(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierBlockView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierBlockView[] }>(`/ap/suppliers/${supplierId}/block-history`);
}

// ─── Query Functions — Tax Registrations ────────────────────────────────────

export async function getSupplierTaxRegistrations(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierTaxRegistrationView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierTaxRegistrationView[] }>(
    `/ap/suppliers/${supplierId}/tax-registrations`,
  );
}

// ─── Query Functions — Legal Documents ──────────────────────────────────────

export async function getSupplierLegalDocs(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierLegalDocView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierLegalDocView[] }>(
    `/ap/suppliers/${supplierId}/legal-docs`,
  );
}

// ─── Query Functions — Evaluations ──────────────────────────────────────────

export async function getSupplierEvaluations(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierEvaluationView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierEvaluationView[] }>(
    `/ap/suppliers/${supplierId}/evaluations`,
  );
}

// ─── Query Functions — Risk Indicators ──────────────────────────────────────

export async function getSupplierRiskIndicators(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierRiskIndicatorView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierRiskIndicatorView[] }>(
    `/ap/suppliers/${supplierId}/risk-indicators`,
  );
}

// ─── Query Functions — Diversity ────────────────────────────────────────────

export async function getSupplierDiversity(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierDiversityView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierDiversityView[] }>(
    `/ap/suppliers/${supplierId}/diversity`,
  );
}

// ─── Query Functions — Contacts ─────────────────────────────────────────────

export async function getSupplierContacts(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierContactView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierContactView[] }>(
    `/ap/suppliers/${supplierId}/contacts`,
  );
}

// ─── Query Functions — Company Overrides ────────────────────────────────────

export async function getSupplierCompanyOverrides(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<{ data: SupplierCompanyOverrideView[] }>> {
  const client = createApiClient(ctx);
  return client.get<{ data: SupplierCompanyOverrideView[] }>(
    `/ap/suppliers/${supplierId}/company-overrides`,
  );
}

// ─── Query Functions — Activation Readiness ─────────────────────────────────

export async function getSupplierActivationReadiness(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<SupplierActivationReadiness>> {
  const client = createApiClient(ctx);
  return client.get<SupplierActivationReadiness>(
    `/ap/suppliers/${supplierId}/activation-readiness`,
  );
}

// ─── Command Functions ──────────────────────────────────────────────────────

export async function createSupplierBlock(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/blocks`, body);
}

export async function removeSupplierBlock(
  ctx: Ctx,
  supplierId: string,
  blockId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.delete<CommandReceipt>(`/ap/suppliers/${supplierId}/blocks/${blockId}`);
}

export async function blacklistSupplier(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/blacklist`, body);
}

export async function reverseBlacklist(
  ctx: Ctx,
  supplierId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/blacklist/reverse`, {});
}

export async function createTaxRegistration(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/tax-registrations`, body);
}

export async function verifyTaxRegistration(
  ctx: Ctx,
  supplierId: string,
  regId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(
    `/ap/suppliers/${supplierId}/tax-registrations/${regId}/verify`,
    {},
  );
}

export async function uploadLegalDoc(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/legal-docs`, body);
}

export async function verifyLegalDoc(
  ctx: Ctx,
  supplierId: string,
  docId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(
    `/ap/suppliers/${supplierId}/legal-docs/${docId}/verify`,
    {},
  );
}

export async function rejectLegalDoc(
  ctx: Ctx,
  supplierId: string,
  docId: string,
  body: { reason: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(
    `/ap/suppliers/${supplierId}/legal-docs/${docId}/reject`,
    body,
  );
}

export async function createSupplierEvaluation(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/evaluations`, body);
}

export async function createRiskIndicator(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/risk-indicators`, body);
}

export async function resolveRiskIndicator(
  ctx: Ctx,
  supplierId: string,
  indicatorId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(
    `/ap/suppliers/${supplierId}/risk-indicators/${indicatorId}/resolve`,
    {},
  );
}

export async function addDiversityCertification(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/diversity`, body);
}

export async function createSupplierContact(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/contacts`, body);
}

export async function updateSupplierContact(
  ctx: Ctx,
  supplierId: string,
  contactId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(
    `/ap/suppliers/${supplierId}/contacts/${contactId}`,
    body,
  );
}

export async function upsertCompanyOverride(
  ctx: Ctx,
  supplierId: string,
  companyId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.put<CommandReceipt>(
    `/ap/suppliers/${supplierId}/company-overrides/${companyId}`,
    body,
  );
}

export async function verifyBankAccount(
  ctx: Ctx,
  supplierId: string,
  bankId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(
    `/ap/suppliers/${supplierId}/bank-accounts/${bankId}/verify`,
    {},
  );
}
