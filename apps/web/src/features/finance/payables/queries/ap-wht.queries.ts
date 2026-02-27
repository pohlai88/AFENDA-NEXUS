import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface WhtCertificateListItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  certificateNumber: string;
  taxYear: number;
  incomeType: string;
  grossAmount: string;
  whtAmount: string;
  whtRate: string;
  currencyCode: string;
  issueDate: string;
  status: 'ISSUED' | 'VOIDED';
}

export interface WhtReportSummary {
  totalGross: string;
  totalWht: string;
  currencyCode: string;
  certificateCount: number;
  byIncomeType: {
    incomeType: string;
    grossAmount: string;
    whtAmount: string;
    count: number;
  }[];
}

// ─── Query Functions ────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

export async function getWhtCertificates(
  ctx: Ctx,
  params: { taxYear?: string; supplierId?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<WhtCertificateListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.taxYear) query.taxYear = params.taxYear;
  if (params.supplierId) query.supplierId = params.supplierId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<WhtCertificateListItem>>('/ap/wht-certificates', query);
}

export async function getWhtReportSummary(
  ctx: Ctx,
  params: { taxYear?: string },
): Promise<ApiResult<WhtReportSummary>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.taxYear) query.taxYear = params.taxYear;
  return client.get<WhtReportSummary>('/ap/wht-certificates/summary', query);
}
