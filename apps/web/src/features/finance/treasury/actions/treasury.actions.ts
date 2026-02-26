'use server';

import { revalidatePath } from 'next/cache';
import type { ForecastPeriodType, ICLoanType, CovenantStatus } from '../types';

// ─── Cash Forecast Actions ───────────────────────────────────────────────────

interface CreateForecastInput {
  name: string;
  description: string;
  periodType: ForecastPeriodType;
  startDate: Date;
  endDate: Date;
  currency: string;
  openingBalance: number;
}

export async function createCashForecast(
  input: CreateForecastInput
): Promise<{ ok: true; forecastId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createCashForecast:', input);
  revalidatePath('/finance/treasury');
  return { ok: true, forecastId: 'fcst-new-' + Date.now() };
}

export async function updateCashForecast(
  id: string,
  updates: Partial<CreateForecastInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateCashForecast:', id, updates);
  revalidatePath('/finance/treasury');
  revalidatePath(`/finance/treasury/forecasts/${id}`);
  return { ok: true };
}

export async function publishForecast(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] publishForecast:', id);
  revalidatePath('/finance/treasury');
  return { ok: true };
}

export async function archiveForecast(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] archiveForecast:', id);
  revalidatePath('/finance/treasury');
  return { ok: true };
}

export async function refreshForecastFromTransactions(
  id: string
): Promise<{ ok: true; updatedPeriods: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] refreshForecastFromTransactions:', id);
  revalidatePath(`/finance/treasury/forecasts/${id}`);
  return { ok: true, updatedPeriods: 12 };
}

// ─── Covenant Actions ────────────────────────────────────────────────────────

interface CreateCovenantInput {
  name: string;
  description: string;
  type: 'financial' | 'reporting' | 'operational';
  facilityId: string;
  metric: string;
  operator: string;
  threshold: number;
  thresholdMax?: number;
  testingFrequency: 'monthly' | 'quarterly' | 'annually';
  gracePeriodDays: number;
  consequences: string;
}

export async function createCovenant(
  input: CreateCovenantInput
): Promise<{ ok: true; covenantId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createCovenant:', input);
  revalidatePath('/finance/treasury');
  return { ok: true, covenantId: 'cov-new-' + Date.now() };
}

export async function updateCovenant(
  id: string,
  updates: Partial<CreateCovenantInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] updateCovenant:', id, updates);
  revalidatePath('/finance/treasury');
  return { ok: true };
}

interface TestCovenantInput {
  covenantId: string;
  periodEnd: Date;
  actualValue: number;
  notes: string;
}

export async function testCovenant(
  input: TestCovenantInput
): Promise<{ ok: true; testId: string; status: CovenantStatus } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] testCovenant:', input);
  revalidatePath('/finance/treasury');
  return { ok: true, testId: 'test-new-' + Date.now(), status: 'compliant' };
}

export async function waiveCovenant(
  id: string,
  waiverDate: Date,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] waiveCovenant:', id, waiverDate, reason);
  revalidatePath('/finance/treasury');
  return { ok: true };
}

// ─── Intercompany Loan Actions ───────────────────────────────────────────────

interface CreateICLoanInput {
  lenderEntityId: string;
  borrowerEntityId: string;
  type: ICLoanType;
  principal: number;
  currency: string;
  interestRate: number;
  rateType: 'fixed' | 'floating';
  referenceRate?: string;
  spread?: number;
  startDate: Date;
  maturityDate: Date;
}

export async function createIntercompanyLoan(
  input: CreateICLoanInput
): Promise<{ ok: true; loanId: string; loanNumber: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] createIntercompanyLoan:', input);
  revalidatePath('/finance/treasury');
  return { ok: true, loanId: 'icl-new-' + Date.now(), loanNumber: 'ICL-2026-' + Date.now() };
}

export async function updateIntercompanyLoan(
  id: string,
  updates: Partial<CreateICLoanInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] updateIntercompanyLoan:', id, updates);
  revalidatePath('/finance/treasury');
  return { ok: true };
}

export async function recordICLoanPayment(
  loanId: string,
  scheduleEntryId: string,
  principalPaid: number,
  interestPaid: number,
  paidDate: Date
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] recordICLoanPayment:', loanId, scheduleEntryId, principalPaid, interestPaid);
  revalidatePath('/finance/treasury');
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-icp-' + Date.now() };
}

export async function accrueInterest(
  loanId: string,
  accrualDate: Date
): Promise<{ ok: true; journalId: string; accruedAmount: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] accrueInterest:', loanId, accrualDate);
  revalidatePath('/finance/treasury');
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-int-' + Date.now(), accruedAmount: 15000 };
}

export async function prepayLoan(
  loanId: string,
  prepaymentAmount: number,
  prepaymentDate: Date
): Promise<{ ok: true; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] prepayLoan:', loanId, prepaymentAmount, prepaymentDate);
  revalidatePath('/finance/treasury');
  revalidatePath('/finance/journal');
  return { ok: true, journalId: 'je-prepay-' + Date.now() };
}

export async function validateArmLengthRate(
  loanId: string
): Promise<{
  ok: true;
  isCompliant: boolean;
  marketRate: number;
  actualRate: number;
  variance: number;
} | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] validateArmLengthRate:', loanId);
  return {
    ok: true,
    isCompliant: true,
    marketRate: 5.25,
    actualRate: 5.5,
    variance: 0.25,
  };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkAccrueInterest(
  asOfDate: Date
): Promise<{ ok: true; loansProcessed: number; totalAccrued: number; journalId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkAccrueInterest:', asOfDate);
  revalidatePath('/finance/treasury');
  revalidatePath('/finance/journal');
  return { ok: true, loansProcessed: 5, totalAccrued: 45000, journalId: 'je-bulk-int-' + Date.now() };
}

export async function generateCovenantReport(
  periodEnd: Date
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] generateCovenantReport:', periodEnd);
  return { ok: true, reportId: 'rpt-cov-' + Date.now() };
}
