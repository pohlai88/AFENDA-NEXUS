'use server';

import { cache } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalDashboard,
  getPortalInvoices,
  getPortalInvoiceDetail,
  getPortalPaymentRuns,
  getPortalRemittance,
  getPortalBankAccounts,
  getPortalWhtCertificates,
  getPortalWhtCertificateDetail,
  getPortalDocuments,
  getPortalDisputes,
  getPortalDisputeDetail,
  getPortalCompliance,
  getPortalNotificationPrefs,
  submitPortalInvoice,
  addPortalBankAccount,
  updatePortalProfile,
  uploadPortalDocument,
  createPortalDispute,
  submitPortalStatementRecon,
  updatePortalNotificationPrefs,
  type PortalNotificationPref,
} from '../queries/portal.queries';

// ─── Read Actions ──────────────────────────────────────────────────────────

export const getSupplierAction = cache(async () => {
  const ctx = await getRequestContext();
  return getPortalSupplier(ctx);
});

export const getDashboardAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDashboard(ctx, supplierId);
});

export const getInvoicesAction = cache(async (
  supplierId: string,
  params?: { page?: string; limit?: string; status?: string }
) => {
  const ctx = await getRequestContext();
  return getPortalInvoices(ctx, supplierId, params);
});

export const getInvoiceDetailAction = cache(async (supplierId: string, invoiceId: string) => {
  const ctx = await getRequestContext();
  return getPortalInvoiceDetail(ctx, supplierId, invoiceId);
});

export const getPaymentRunsAction = cache(async (
  supplierId: string,
  params?: { page?: string; limit?: string }
) => {
  const ctx = await getRequestContext();
  return getPortalPaymentRuns(ctx, supplierId, params);
});

export const getRemittanceAction = cache(async (supplierId: string, runId: string) => {
  const ctx = await getRequestContext();
  return getPortalRemittance(ctx, supplierId, runId);
});

export const getBankAccountsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalBankAccounts(ctx, supplierId);
});

export const getWhtCertificatesAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalWhtCertificates(ctx, supplierId);
});

export const getWhtCertificateDetailAction = cache(async (supplierId: string, certId: string) => {
  const ctx = await getRequestContext();
  return getPortalWhtCertificateDetail(ctx, supplierId, certId);
});

export const getDocumentsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDocuments(ctx, supplierId);
});

export const getDisputesAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDisputes(ctx, supplierId);
});

export const getDisputeDetailAction = cache(async (supplierId: string, disputeId: string) => {
  const ctx = await getRequestContext();
  return getPortalDisputeDetail(ctx, supplierId, disputeId);
});

export const getComplianceAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalCompliance(ctx, supplierId);
});

export const getNotificationPrefsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalNotificationPrefs(ctx, supplierId);
});

// ─── Mutation Actions ──────────────────────────────────────────────────────

export async function submitInvoiceAction(
  supplierId: string,
  body: { invoices: Record<string, unknown>[] }
) {
  const ctx = await getRequestContext();
  return submitPortalInvoice(ctx, supplierId, body);
}

export async function addBankAccountAction(
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
) {
  const ctx = await getRequestContext();
  return addPortalBankAccount(ctx, supplierId, body);
}

export async function updateProfileAction(supplierId: string, body: Record<string, unknown>) {
  const ctx = await getRequestContext();
  return updatePortalProfile(ctx, supplierId, body);
}

export async function uploadDocumentAction(
  supplierId: string,
  body: {
    category: string;
    title: string;
    fileName: string;
    mimeType: string;
    content: string;
    expiresAt?: string;
  }
) {
  const ctx = await getRequestContext();
  return uploadPortalDocument(ctx, supplierId, body);
}

export async function createDisputeAction(
  supplierId: string,
  body: {
    invoiceId?: string;
    paymentRunId?: string;
    category: string;
    subject: string;
    description: string;
  }
) {
  const ctx = await getRequestContext();
  return createPortalDispute(ctx, supplierId, body);
}

export async function submitStatementReconAction(
  supplierId: string,
  body: { lines: Record<string, unknown>[] }
) {
  const ctx = await getRequestContext();
  return submitPortalStatementRecon(ctx, supplierId, body);
}

export async function updateNotificationPrefsAction(
  supplierId: string,
  body: { preferences: PortalNotificationPref[] }
) {
  const ctx = await getRequestContext();
  return updatePortalNotificationPrefs(ctx, supplierId, body);
}
