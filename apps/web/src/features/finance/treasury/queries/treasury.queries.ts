'use server';

import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ─────────────────────────────────────────────────

export interface CashForecastView {
  id: string;
  name: string;
  description: string;
  periodType: string;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  openingBalance: number;
  closingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CovenantView {
  id: string;
  name: string;
  description: string;
  type: string;
  facilityId: string;
  facilityName: string;
  lenderId: string;
  lenderName: string;
  metric: string;
  operator: string;
  threshold: number;
  thresholdMax?: number;
  currentValue: number;
  status: string;
  testingFrequency: string;
  nextTestDate: string;
  lastTestDate: string;
  gracePeriodDays: number;
  consequences: string;
  createdAt: string;
  updatedAt: string;
}

export interface CovenantTestView {
  id: string;
  covenantId: string;
  testDate: string;
  periodEnd: string;
  actualValue: number;
  threshold: number;
  variance: number;
  variancePercent: number;
  status: string;
  notes: string;
  testedBy: string;
  approvedBy: string;
  approvedAt: string;
}

export interface IntercompanyLoanView {
  id: string;
  loanNumber: string;
  lenderEntityId: string;
  lenderEntityName: string;
  borrowerEntityId: string;
  borrowerEntityName: string;
  type: string;
  principal: number;
  outstandingBalance: number;
  currency: string;
  interestRate: number;
  rateType: string;
  referenceRate?: string;
  spread?: number;
  startDate: string;
  maturityDate: string;
  accruedInterest: number;
  totalInterestPaid: number;
  status: string;
  armLengthRate: number;
  isArmLength: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICLoanScheduleEntryView {
  id: string;
  loanId: string;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalPaid: number;
  interestPaid: number;
  paidDate: string | null;
  status: string;
}

export interface TreasurySummaryView {
  totalCashPosition: number;
  forecastedEndOfMonth: number;
  activeLoans: number;
  totalLoanBalance: number;
  covenantsAtRisk: number;
  covenantsBreeched: number;
  upcomingMaturities: number;
  netIntercompanyPosition: number;
}

// ─── Queries ─────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId?: string; token?: string };

export async function getCashForecasts(
  ctx: Ctx,
  params?: { status?: string },
): Promise<ApiResult<PaginatedResponse<CashForecastView>>> {
  const api = createApiClient(ctx);
  const qs = params?.status ? `?status=${params.status}` : '';
  return api.get(`/cash-forecasts${qs}`);
}

export async function getCashForecastById(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<CashForecastView>> {
  const api = createApiClient(ctx);
  return api.get(`/cash-forecasts/${id}`);
}

export async function getCovenants(
  ctx: Ctx,
  params?: { status?: string; facilityId?: string },
): Promise<ApiResult<PaginatedResponse<CovenantView>>> {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.status) qp.set('status', params.status);
  if (params?.facilityId) qp.set('facilityId', params.facilityId);
  const qs = qp.toString() ? `?${qp.toString()}` : '';
  return api.get(`/covenants${qs}`);
}

export async function getCovenantById(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<CovenantView & { tests: CovenantTestView[] }>> {
  const api = createApiClient(ctx);
  return api.get(`/covenants/${id}`);
}

export async function getIntercompanyLoans(
  ctx: Ctx,
  params?: { status?: string; entityId?: string },
): Promise<ApiResult<PaginatedResponse<IntercompanyLoanView>>> {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.status) qp.set('status', params.status);
  if (params?.entityId) qp.set('entityId', params.entityId);
  const qs = qp.toString() ? `?${qp.toString()}` : '';
  return api.get(`/ic-loans${qs}`);
}

export async function getICLoanById(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<IntercompanyLoanView & { schedule: ICLoanScheduleEntryView[] }>> {
  const api = createApiClient(ctx);
  return api.get(`/ic-loans/${id}`);
}

export async function getTreasurySummary(
  ctx: Ctx,
): Promise<ApiResult<TreasurySummaryView>> {
  const api = createApiClient(ctx);
  return api.get('/treasury/summary');
}

// ─── Commands ────────────────────────────────────────────────────

export async function createForecastCmd(
  ctx: Ctx,
  input: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post('/cash-forecasts', input);
}

export async function createCovenantCmd(
  ctx: Ctx,
  input: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post('/covenants', input);
}

export async function testCovenantCmd(
  ctx: Ctx,
  input: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post(`/covenants/${input.covenantId}/tests`, input);
}

export async function createICLoanCmd(
  ctx: Ctx,
  input: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post('/ic-loans', input);
}

export async function recordLoanPaymentCmd(
  ctx: Ctx,
  loanId: string,
  input: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post(`/ic-loans/${loanId}/payments`, input);
}
