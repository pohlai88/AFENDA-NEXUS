import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { SupplierStatus } from '@afenda/contracts';

// ─── View Models ────────────────────────────────────────────────────────────

export interface SupplierListItem {
  id: string;
  code: string;
  name: string;
  status: SupplierStatus;
  taxId?: string;
  currencyCode: string;
  defaultPaymentMethod?: string;
  createdAt: string;
}

export interface SupplierSiteView {
  id: string;
  siteCode: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary: boolean;
}

export interface SupplierBankAccountView {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftBic?: string;
  iban?: string;
  routingNumber?: string;
  currencyCode: string;
  isPrimary: boolean;
}

export interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  status: SupplierStatus;
  taxId?: string;
  currencyCode: string;
  defaultPaymentMethod?: string;
  paymentTerms?: string;
  whtRateId?: string;
  remittanceEmail?: string;
  companyId: string;
  companyName: string;
  sites: SupplierSiteView[];
  bankAccounts: SupplierBankAccountView[];
  invoiceCount: number;
  openBalance: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

export async function getSuppliers(
  ctx: Ctx,
  params: { status?: string; q?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<SupplierListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.q) query.q = params.q;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<SupplierListItem>>('/ap/suppliers', query);
}

export async function getSupplier(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<SupplierDetail>> {
  const client = createApiClient(ctx);
  return client.get<SupplierDetail>(`/ap/suppliers/${id}`);
}

export async function createSupplier(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/suppliers', body);
}

export async function updateSupplier(
  ctx: Ctx,
  id: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/ap/suppliers/${id}`, body);
}

export async function addSupplierSite(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/sites`, body);
}

export async function addSupplierBankAccount(
  ctx: Ctx,
  supplierId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/suppliers/${supplierId}/bank-accounts`, body);
}
